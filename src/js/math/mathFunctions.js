// all functions are from http://bl.ocks.org/ivyywang/7c94cb5a3accd9913263
export { eulerAngles, isValue};


const to_radians = Math.PI / 180;
const to_degrees = 180 / Math.PI;


// Helper function: cross product of two vectors v0&v1
function cross(v0, v1) {
    return [v0[1] * v1[2] - v0[2] * v1[1], v0[2] * v1[0] - v0[0] * v1[2], v0[0] * v1[1] - v0[1] * v1[0]];
}

//Helper function: dot product of two vectors v0&v1
function dot(v0, v1) {
    let sum = 0;
    for (let i = 0; v0.length > i; ++i) sum += v0[i] * v1[i];
    return sum;
}

// Helper function:
// This function converts a [lon, lat] coordinates into a [x,y,z] coordinate
// the [x, y, z] is Cartesian, with origin at lon/lat (0,0) center of the earth
function lonlat2xyz(coord) {

    let lon = coord[0] * to_radians;
    let lat = coord[1] * to_radians;

    let x = Math.cos(lat) * Math.cos(lon);

    let y = Math.cos(lat) * Math.sin(lon);

    let z = Math.sin(lat);

    return [x, y, z];
}

// Helper function:
// This function computes a quaternion representation for the rotation between to vectors
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quaternion(v0, v1) {

    if (v0 && v1) {

        let w = cross(v0, v1),  // vector pendicular to v0 & v1
            w_len = Math.sqrt(dot(w, w)); // length of w

        if (w_len == 0)
            return;

        let theta = 0.5 * Math.acos(Math.max(-1, Math.min(1, dot(v0, v1)))),

            qi = w[2] * Math.sin(theta) / w_len;
        qj = - w[1] * Math.sin(theta) / w_len;
        qk = w[0] * Math.sin(theta) / w_len;
        qr = Math.cos(theta);

        return theta && [qr, qi, qj, qk];
    }
}

// Helper function:
// This functions converts euler angles to quaternion
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function euler2quat(e) {

    if (!e) return;

    let roll = 0.5 * e[0] * to_radians,
        pitch = 0.5 * e[1] * to_radians,
        yaw = 0.5 * e[2] * to_radians,

        sr = Math.sin(roll),
        cr = Math.cos(roll),
        sp = Math.sin(pitch),
        cp = Math.cos(pitch),
        sy = Math.sin(yaw),
        cy = Math.cos(yaw),

        qi = sr * cp * cy - cr * sp * sy,
        qj = cr * sp * cy + sr * cp * sy,
        qk = cr * cp * sy - sr * sp * cy,
        qr = cr * cp * cy + sr * sp * sy;
    return [qr, qi, qj, qk];
}

// This functions computes a quaternion multiply
// Geometrically, it means combining two quant rotations
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/arithmetic/index.htm
function quatMultiply(q1, q2) {
    if (!q1 || !q2) return;

    let a = q1[0],
        b = q1[1],
        c = q1[2],
        d = q1[3],
        e = q2[0],
        f = q2[1],
        g = q2[2],
        h = q2[3];

    return [
        a * e - b * f - c * g - d * h,
        b * e + a * f + c * h - d * g,
        a * g - b * h + c * e + d * f,
        a * h + b * g - c * f + d * e];

}

// This function computes quaternion to euler angles
// https://en.wikipedia.org/wiki/Rotation_formalisms_in_three_dimensions#Euler_angles_.E2.86.94_Quaternion
function quat2euler(t) {

    if (!t) return;

    return [Math.atan2(2 * (t[0] * t[1] + t[2] * t[3]), 1 - 2 * (t[1] * t[1] + t[2] * t[2])) * to_degrees,
    Math.asin(Math.max(-1, Math.min(1, 2 * (t[0] * t[2] - t[3] * t[1])))) * to_degrees,
    Math.atan2(2 * (t[0] * t[3] + t[1] * t[2]), 1 - 2 * (t[2] * t[2] + t[3] * t[3])) * to_degrees
    ];
}

/*  This function computes the euler angles when given two vectors, and a rotation
    This is really the only math function called with d3 code.

    v0 - starting pos in lon/lat, commonly obtained by projection.invert
    v1 - ending pos in lon/lat, commonly obtained by projection.invert
    o0 - the projection rotation in euler angles at starting pos (v0), commonly obtained by projection.rotate
*/

function eulerAngles(v0, v1, o0) {

    /*
        The math behind this:
        - first calculate the quaternion rotation between the two vectors, v0 & v1
        - then multiply this rotation onto the original rotation at v0
        - finally convert the resulted quat angle back to euler angles for d3 to rotate
    */

    var t = quatMultiply(euler2quat(o0), quaternion(lonlat2xyz(v0), lonlat2xyz(v1)));
    return quat2euler(t);
}

function Snake(params) {
    const PARTICLE_MULTIPLIER = 1 / 500,
        MAX_INTENSITY = 1,
        MAX_PARTICLE_AGE = 400,
        PARTICLE_LINE_WIDTH = 2;
    let bilinearInterpolateVector = function (x, y, g00, g10, g01, g11) {
        let rx = (1 - x);
        let ry = (1 - y);
        let a = rx * ry,
            b = x * ry,
            c = rx * y,
            d = x * y;
        let u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
        let v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
        return [u, v, Math.sqrt(u * u + v * v)];
    };
    let createBuilder = function (data) {
        return {
            header: data.headers,
            get: function (i) {
                return [data.u[i], data.v[i]]
            },
            interpolate: bilinearInterpolateVector
        };
    };
    let buildGrid = function (data, callback) {
        let builder = createBuilder(data);
        let header = builder.header;
        const Δx = header.dx,
            Δy = header.dy,
            ni = header.nx,
            nj = header.ny;
        // 將資料放成 2D matrix [row[column]]
        let grid = [], p = 0;
        for (let i = 0; i < ni; i++) {
            let row = [];
            for (let j = 0; j < nj; j++, p++) {
                row[j] = builder.get(p);
            }
            grid[i] = row;
        }

        let interpolate = function (x, y) {
            let fi = Math.floor(x / Δx),
                fj = Math.floor(y / Δy),
                dx = 0.3,
                dy = 0.3;
            try {
                return builder.interpolate(dx, dy, grid[fi][fj], grid[fi + 1][fj], grid[fi][fj + 1], grid[fi + 1][fj + 1]);
            } catch (e) {
                return null;
            }
        };

        callback({
            data: {
                s: grid
            },
            interpolate: interpolate
        });
    };
    let animate = function (grid, bounds) {
        console.log("Test animate");
        let isValue = function (x) {
            return x !== null && x !== undefined;
        };

        // Colors
        function asColorStyle(r, g, b, a) {
            return "rgba(" + 243 + ", " + 243 + ", " + 238 + ", " + a + ")";
        }
        function cutHex(h) {
            return h.charAt(0) == "#" ? h.substing(1, 7) : h;
        }
        function hexToR(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substing(0, 2), 16);
        }
        function hexToG(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substing(2, 4), 16);
        }
        function hexToB(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substing(4, 6), 16);
        }
        function IntensityColorScale(maxWind) {
            let result = [
                "rgba(" + hexToR('#00ffff') + ", " + hexToG('#00ffff') + ", " + hexToB('#00ffff') + ", " + 0.5 + ")",
                "rgba(" + hexToR('#64f0ff') + ", " + hexToG('#64f0ff') + ", " + hexToB('#64f0ff') + ", " + 0.5 + ")",
                "rgba(" + hexToR('#87e1ff') + ", " + hexToG('#87e1ff') + ", " + hexToB('#87e1ff') + ", " + 0.5 + ")",
                "rgba(" + hexToR('#a0d0ff') + ", " + hexToG('#a0d0ff') + ", " + hexToB('#a0d0ff') + ", " + 0.5 + ")",
                "rgba(" + hexToR('#b5c0ff') + ", " + hexToG('#b5c0ff') + ", " + hexToB('#b5c0ff') + ", " + 0.5 + ")",
                "rgba(" + hexToR('#c6adff') + ", " + hexToG('#c6adff') + ", " + hexToB('#c6adff') + ", " + 0.2 + ")",
                "rgba(" + hexToR('#d49bff') + ", " + hexToG('#d49bff') + ", " + hexToB('#d49bff') + ", " + 0.2 + ")",
                "rgba(" + hexToR('#e185ff') + ", " + hexToG('#e185ff') + ", " + hexToB('#e185ff') + ", " + 0.2 + ")",
                "rgba(" + hexToR('#ec6dff') + ", " + hexToG('#ec6dff') + ", " + hexToB('#ec6dff') + ", " + 0.2 + ")",
                "rgba(" + hexToR('#ff1edb') + ", " + hexToG('#ff1edb') + ", " + hexToB('#ff1edb') + ", " + 0.2 + ")"
            ];
            result.indexFor = function (m) {
                return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
            };
            return result;
        }

        let colorStyles = IntensityColorScale(MAX_INTENSITY);
        const fadeFillStyle = "rgba(0,0,0, 0.99)";
        const particleCount = Math.round(bounds[1][0] * bounds[1][1] * PARTICLE_MULTIPLIER);
        let buckets = colorStyles.map(() => { return []; });
        let particles = [];
        // 建出 particle 給 d3 繪圖用
        for (let i = 0; i < particleCount; i++) {
            let _x = Math.random() * bounds[1][0],
                _y = Math.random() * bounds[1][1],
                __data__ = grid.interpolate(_x, _y);
            if (isValue(__data__)) {
                particles.push({
                    x: __data__[0],
                    y: __data__[1],
                    m: __data__[2],
                    age: Math.floor(Math.random() * MAX_PARTICLE_AGE),
                    xt: _x - __data__[0],
                    xy: _y - __data__[1],
                    sx: _x,
                    sy: _y
                });
            }
        }
        function evolve() {
            buckets.forEach((item) => { item.length = 0; });
            particles.forEach((item) => {
                if (item.age > MAX_PARTICLE_AGE) {
                    item.x = item.sx;
                    item.y = item.sy;
                    item.age = 0;
                }
                let __data__ = grid.interpolate(item.x, item.y);
                if (isValue(__data__)) {
                    item.xt = item.x - __data__[0];
                    item.yt = item.y - __data__[1];
                    item.m = __data__[2];
                    item.x += __data__[0];
                    item.y += __data__[1];
                    // indexFor 是 colorStyles 裡的 function
                    buckets[colorStyles.indexFor(Math.abs(item.m))].push(item);
                }
                item.age += 1;
            });
        }

        let g = params.canvas.getContext("2d");
        g.lineWidth = PARTICLE_LINE_WIDTH;
        g.fillStyle = fadeFillStyle;

        function draw() {
            // Fade existing particle trails.
            let prev = g.globalCompositeOperation;
            g.globalCompositeOperation = "destination-in";
            g.fillRect(bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]);
            g.globalCompositeOperation = prev;
            // Draw new particle trails.
            buckets.forEach((bucket, i) => {
                if (bucket.length > 0) {
                    g.beginPath();
                    g.strokeStyle = colorStyles[i];
                    bucket.forEach((particle, j) => {
                        let _m = particle.m;
                        g.moveTo(particle.x, particle.y);
                        g.lineTo(particle.xt, particle.yt);
                    });
                    g.stroke();
                }
            });
        }

        d3.timer(() => {
            evolve();
            draw();
        });

    };

    let start = function (bounds, width, height) {
        buildGrid(params.data, function (grid) {
            animate(grid, bounds);
        });
    };

    const snake = {
        start: start
    };

    return snake;
}

function isValue(x){
    return x !== null && x !== undefined;
}

// module.exports = {
//     eulerAngles: eulerAngles,
//     isValue: isValue,
// };