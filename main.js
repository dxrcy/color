const COLORS = [
    // rgb
    { mode: "rgb", id: "r", colors: min_and_max(identity, { r: 0 }, { r: 255 }) },
    { mode: "rgb", id: "g", colors: min_and_max(identity, { g: 0 }, { g: 255 }) },
    { mode: "rgb", id: "b", colors: min_and_max(identity, { b: 0 }, { b: 255 }) },
    // hsv
    // hue is calculated separately
    { mode: "hsv", id: "s", colors: min_and_max(hsv_to_rgb, { s: 0 }, { s: 100 }) },
    { mode: "hsv", id: "v", colors: min_and_max(hsv_to_rgb, { v: 0 }, { v: 100 }) },
    // cmyk
    { mode: "cmyk", id: "c", colors: min_and_max(cmyk_to_rgb, { c: 0 }, { c: 100 }) },
    { mode: "cmyk", id: "m", colors: min_and_max(cmyk_to_rgb, { m: 0 }, { m: 100 }) },
    { mode: "cmyk", id: "y", colors: min_and_max(cmyk_to_rgb, { y: 0 }, { y: 100 }) },
    { mode: "cmyk", id: "k", colors: min_and_max(cmyk_to_rgb, { k: 0 }, { k: 100 }) },
];

const SLIDERS = [
    { mode: "rgb",
        list: [ {id: "r", max: 255}, {id: "g", max: 255}, {id: "b", max: 255}],
    },
    { mode: "hsv",
        list: [ {id: "h", max: 360}, {id: "s", max: 100}, {id: "v", max: 100}],
    },
    { mode: "cmyk",
        list: [ {id: "c", max: 100}, {id: "m", max: 100}, {id: "y", max: 100}, {id: "k", max: 100}],
    },
];

function init() {
    create_sliders();
    State.reset();
}

class State {
    static rgb  = { r: 0, g: 0, b: 0 };
    static hsv  = { h: 0, s: 0, v: 0 };
    static cmyk = { c: 0, m: 0, y: 0, k: 0 };

    static cache = {
        h: 0,
        s: 0,
    };

    static sync(mode) {
        console.log(`Update for ${mode}`);
        switch (mode) {

            case "rgb": {
                this.cmyk = rgb_to_cmyk(this.rgb);
                this.hsv = rgb_to_hsv(this.rgb);
                this.update_cache_hsv();
                this.update_cache_cmyk();
            }; break;

            case "hsv": {
                this.rgb = hsv_to_rgb(this.hsv);
                this.cmyk = rgb_to_cmyk(this.rgb);
                this.update_cache_cmyk();
                this.override_cmyk();
            }; break;

            case "cmyk": {
                this.rgb = cmyk_to_rgb(this.cmyk);
                this.hsv = rgb_to_hsv(this.rgb);
                this.update_cache_hsv();
                this.override_hsv();
            }; break;

            default: {
                throw `Invalid mode '${mode}'`;
            }
        }
    }

    static update_cache_hsv() {
        if (this.hsv.v == 0) {
            this.hsv.s = Math.round(this.cache.s / 100) * 100;
        } else {
            this.cache.s = this.hsv.s;
        }
        if (this.hsv.s == 0 || this.hsv.v == 0) {
            this.hsv.h = this.cache.h;
        } else {
            this.cache.h = this.hsv.h;
        }
    }
    static update_cache_cmyk() {
        if (this.hsv.v == 0) {
            this.cmyk.c = this.cache.c;
            this.cmyk.m = this.cache.m;
            this.cmyk.y = this.cache.y;
        } else {
            this.cache.c = this.cmyk.c;
            this.cache.m = this.cmyk.m;
            this.cache.y = this.cmyk.y;
        }
    }
    static override_hsv() {
        if (this.cmyk.k == 100) {
            let hsv = cmyk_to_hsv({ ...this.cmyk, k: 50 });
            this.hsv.h = hsv.h;
            this.hsv.s = hsv.s;
        }
    }
    static override_cmyk() {
        if (this.hsv.v == 0) {
            let cmyk = hsv_to_cmyk({ ...this.hsv, v: 100 });
            this.cmyk.c = cmyk.c;
            this.cmyk.m = cmyk.m;
            this.cmyk.y = cmyk.y;
        }
    }

    static pull(mode) {
        switch (mode) {
            case "_color": {
                let hex = document.querySelector("#color").value;
                this.rgb = hex_to_rgb(hex);
                mode = "rgb";
            }; break;
            case "rgb": {
                this.rgb.r = parseInt(document.querySelector("#slider-r").value);
                this.rgb.g = parseInt(document.querySelector("#slider-g").value);
                this.rgb.b = parseInt(document.querySelector("#slider-b").value);
            }; break;
            case "hsv": {
                this.hsv.h = parseInt(document.querySelector("#slider-h").value);
                this.hsv.s = parseInt(document.querySelector("#slider-s").value);
                this.hsv.v = parseInt(document.querySelector("#slider-v").value);
            }; break;
            case "cmyk": {
                this.cmyk.c = parseInt(document.querySelector("#slider-c").value);
                this.cmyk.m = parseInt(document.querySelector("#slider-m").value);
                this.cmyk.y = parseInt(document.querySelector("#slider-y").value);
                this.cmyk.k = parseInt(document.querySelector("#slider-k").value);
            }; break;
            default: {
                throw `Invalid mode '${mode}'`;
            }
        }
        this.sync(mode);
        this.push();
    }

    static push() {
        for (let { mode, list } of SLIDERS) {
            let group = this[mode];
            console.log(group);
            for (let { id } of list) {
                let value = group[id];
                document.querySelector(`#slider-${id}`).value = Math.round(value);
            }
        }

        for (let { mode, id, colors } of COLORS) {
            let group = this[mode];
            let [min, max] = colors(group);
            let gradient = `linear-gradient(to right, ${min}, ${max})`;
            document.querySelector(`#slider-${id}`).style.background = gradient;
        }
        this.set_hue_gradient();
        
        let hex = rgb_to_hex(this.rgb);
        document.querySelector("#color").value = hex;
        document.querySelector("#display").style.backgroundColor = hex;
        // document.querySelector("#display").innerText = hex;
    }

    static set_hue_gradient() {
        let steps = [];
        for (let h = 0; h <= 360; h += 5) {
            let { r, g, b } = hsv_to_rgb({
                h,
                s: Math.max(this.hsv.s, 20),
                v: this.hsv.v,
            });
            steps.push(`rgb(${r}, ${g}, ${b})`);
        }
        let gradient = `linear-gradient(to right, ${steps.join(", ")})`;
        document.querySelector("#slider-h").style.background = gradient;
    }

    static reset() {
        this.rgb = { r: 255, g: 0, b: 0 };
        this.sync("rgb");
        this.push();
    }
    static randomize() {
        this.rgb = random_rgb();
        this.sync("rgb");
        this.push();
    }
}

function min_and_max(f, min_value, max_value) {
    return function (group) {
        let min = f({ ...group, ...min_value });
        let max = f({ ...group, ...max_value });
        return [
            `rgb(${min.r}, ${min.g}, ${min.b})`,
            `rgb(${max.r}, ${max.g}, ${max.b})`,
        ];
    };
}
function identity(x) {
    return x;
}

function create_sliders() {
    let html = "";
    for (let { mode, list } of SLIDERS) {
        html += render_slider_group(mode, list);
    }
    document.querySelector("#sliders").innerHTML = html;
}

function render_slider_group(mode, list) {
    let sliders = "";
    for (let { id, max } of list) {
        sliders += render_slider(mode, id, max);
    }
    return `
        <div class="group">
            <h3 class="mode"> ${mode.toUpperCase()} </h3>
            <div class="rows">
                ${sliders}
            </div>
        </div>
    `;
}

function render_slider(mode, id, max) {
    return `
        <div class="row">
            <label for="${id}"> ${id.toUpperCase()} </label>
            <input
                type="range"
                data-mode="${mode}"
                id="slider-${id}"
                name="${id}"
                value="0"
                min="0"
                max="${max}"
                oninput="State.pull('${mode}')"
            >
        </div>
    `;
}

function random_rgb() {
    return {
        r: random_component(),
        g: random_component(),
        b: random_component(),
    };
}
function random_component() {
    return Math.floor(Math.random() * 255);
}

// NOTE: Do not use object destructuring in function parameter.
// Otherwise, if objects are passed by reference (default), they will be mutated.

// NOTE: Do not touch the below functions, assume they work.

function hsv_to_rgb(hsv) {
    const h = hsv.h / 360;
    const s = hsv.s / 100;
    const v = hsv.v / 100;
    var r, g, b, i, f, p, q, t;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
    }
    return {
        r: (r * 255),
        g: (g * 255),
        b: (b * 255)
    };
}
function rgb_to_hsv(rgb) {
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;
    var max = Math.max(r, g, b), min = Math.min(r, g, b),
        d = max - min,
        h,
        s = (max === 0 ? 0 : d / max),
        v = max / 255;
    switch (max) {
        case min: h = 0; break;
        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
        case g: h = (b - r) + d * 2; h /= 6 * d; break;
        case b: h = (r - g) + d * 4; h /= 6 * d; break;
    }
    return {
        h: h * 360,
        s: s * 100,
        v: v * 100,
    };
}
function component_to_hex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}
function rgb_to_hex(rgb) {
    const r = rgb.r;
    const g = rgb.g;
    const b = rgb.b;
    return "#" + component_to_hex(r) + component_to_hex(g) + component_to_hex(b);
}
function hex_to_rgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}
function rgb_to_cmyk(rgb) {
    const r = rgb.r / 255;
    const g = rgb.g / 255;
    const b = rgb.b / 255;
    const c = 1 - r;
    const m = 1 - g;
    const y = 1 - b;
    const k = Math.min(c, m, y);
    const adjusted_c = (c - k) / (1 - k);
    const adjusted_m = (m - k) / (1 - k);
    const adjusted_y = (y - k) / (1 - k);
    return {
        c: (adjusted_c * 100),
        m: (adjusted_m * 100),
        y: (adjusted_y * 100),
        k: (k * 100)
    };
}
function cmyk_to_rgb(cmyk) {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;
    const r = (255 * (1 - c) * (1 - k));
    const g = (255 * (1 - m) * (1 - k));
    const b = (255 * (1 - y) * (1 - k));
    return {
        r: Math.min(255, Math.max(0, r)),
        g: Math.min(255, Math.max(0, g)),
        b: Math.min(255, Math.max(0, b))
    };
}
function cmyk_to_hsv(cmyk) {
    let rgb = cmyk_to_rgb(cmyk);
    return rgb_to_hsv(rgb);
}
function hsv_to_cmyk(hsv) {
    let rgb = hsv_to_rgb(hsv);
    return rgb_to_cmyk(rgb);
}
