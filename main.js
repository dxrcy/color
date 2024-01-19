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

    static pull(mode) {
        switch (mode) {
            case "_color": {
                let hex = document.querySelector("#color").value;
                this.rgb = hex_to_rgb(hex);
                mode = "rgb";
            }; break;
            case "rgb": {
                this.rgb.r = parseFloat(document.querySelector("#slider-r").value);
                this.rgb.g = parseFloat(document.querySelector("#slider-g").value);
                this.rgb.b = parseFloat(document.querySelector("#slider-b").value);
            }; break;
            case "hsv": {
                this.hsv.h = parseFloat(document.querySelector("#slider-h").value);
                this.hsv.s = parseFloat(document.querySelector("#slider-s").value);
                this.hsv.v = parseFloat(document.querySelector("#slider-v").value);
            }; break;
            case "cmyk": {
                this.cmyk.c = parseFloat(document.querySelector("#slider-c").value);
                this.cmyk.m = parseFloat(document.querySelector("#slider-m").value);
                this.cmyk.y = parseFloat(document.querySelector("#slider-y").value);
                this.cmyk.k = parseFloat(document.querySelector("#slider-k").value);
            }; break;
            default: {
                throw `Invalid mode '${mode}'`;
            }
        }
        this.sync(mode);
        this.push();
    }

    static sync(mode) {
        console.log(`Update for ${mode}`);
        switch (mode) {
            case "rgb": {
                this.cmyk = rgb_to_cmyk(this.rgb);
                this.hsv = rgb_to_hsv(this.rgb);
            }; break;
            case "hsv": {
                this.rgb = hsv_to_rgb(this.hsv);
                this.cmyk = rgb_to_cmyk(this.rgb);
            }; break;
            case "cmyk": {
                this.rgb = cmyk_to_rgb(this.cmyk);
                this.hsv = rgb_to_hsv(this.rgb);
            }; break;
            default: {
                throw `Invalid mode '${mode}'`;
            }
        }
    }

    static push() {
        for (let { mode, list } of SLIDERS) {
            let group = this[mode];
            console.log(group);
            for (let { id } of list) {
                let value = group[id];
                document.querySelector(`#slider-${id}`).value = value;
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
            let { r, g, b } = hsv_to_rgb({ ...this.hsv, h });
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
        <div>
            <h3> ${mode} </h3>
            ${sliders}
        </div>
    `;
}

function render_slider(mode, id, max) {
    return `
        <input
            type="range"
            data-mode="${mode}"
            id="slider-${id}"
            value="0"
            min="0"
            max="${max}"
            oninput="State.pull('${mode}')"
        >
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
        r: Math.round(r * 255),
        g: Math.round(g * 255),
        b: Math.round(b * 255)
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
    if (v == 0) {
        s = 100;
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
        c: Math.round(adjusted_c * 100),
        m: Math.round(adjusted_m * 100),
        y: Math.round(adjusted_y * 100),
        k: Math.round(k * 100)
    };
}
function cmyk_to_rgb(cmyk) {
    const c = cmyk.c / 100;
    const m = cmyk.m / 100;
    const y = cmyk.y / 100;
    const k = cmyk.k / 100;
    const r = Math.round(255 * (1 - c) * (1 - k));
    const g = Math.round(255 * (1 - m) * (1 - k));
    const b = Math.round(255 * (1 - y) * (1 - k));
    return {
        r: Math.min(255, Math.max(0, r)),
        g: Math.min(255, Math.max(0, g)),
        b: Math.min(255, Math.max(0, b))
    };
}
