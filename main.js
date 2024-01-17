class State {
    static rgb = { r: 0, g: 0, b: 0 };
    static hsv = { h: 0, s: 0, v: 0 };

    static pull(mode) {
        switch (mode) {
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
            default: {
                throw `Invalid mode '${mode}'`
            }
        }
        this.sync(mode);
        this.push();
    }

    static sync(mode) {
        console.log(`Update for ${mode}`);
        switch (mode) {
            case "rgb": {
                this.hsv = rgb_to_hsv(this.rgb);
            }; break;
            case "hsv": {
                this.rgb = hsv_to_rgb(this.hsv);
            }; break;
            default: {
                throw `Invalid mode '${mode}'`
            }
        }
    }

    static push() {
        for (let { mode, list } of SLIDERS) {
            let group = this[mode];
            console.log(group);
            for (let { id } of list) {
                document.querySelector(`#slider-${id}`).value = group[id];
            }
        }
    }

    static randomize() {
        let r = 100;
        let g = 100;
        let b = 100;
        this.rgb = { r, g, b };
        this.sync("rgb");
        this.push();
    }
}

function hsv_to_rgb({ h, s, v }) {
    s /= 100;
    v /= 100;
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
function rgb_to_hsv({ r, g, b }) {
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

function init() {
    create_sliders();
    State.randomize();
}

const SLIDERS = [
    {
        mode: "rgb",
        list: [ {id: "r", max: 255}, {id: "g", max: 255}, {id: "b", max: 255}],
    },
    {
        mode: "hsv",
        list: [ {id: "h", max: 360}, {id: "s", max: 100}, {id: "v", max: 100}],
    },
];

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
            <h3>${mode}</h3>
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
            onchange="State.pull('${mode}')"
        >
    `;
}

