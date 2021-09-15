// import { isValue } from "./mathFunctions";
import { isValue } from "./math";
export { Vector_snake };
const Vector_snake = function(params){
    const PARTICLE_MULTIPLIER = 1/1000,
        MAX_INTENSITY = 10,
        MAX_PARTICLE_AGE = 400,
        PARTICLE_LINE_WIDTH = 10;
    let bilinearInterpolateVector = function(x, y, g00, g10, g01, g11){
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
    let createBuilder = function(data){
        console.log("data u:", data.u[1]);
        return {
            header: data.headers,
            get: function(i){
                return [ data.u[i], data.v[i]];
            },
            interpolate: bilinearInterpolateVector
        };
    };
    let buildGrid = function(data){
        let builder = createBuilder(data);
        let header = builder.header;
        const x0 = header.x0, y0 = header.y0;
        const Δx = header.dx,
            Δy = header.dy,
            ni = header.nx,
            nj = header.ny;
        // 將資料放成 2D matrix [row[column]]
        let grid = [], p = 0;
        for (let i = 0; i < ni; i++){
            let row = [];
            for (let j = 0; j < nj; j++, p++){
                row[j] = builder.get(p);
            }
            grid[i] = row;
        }
        // let grid = Array(ni).fill([data.u, data.v]).map(() => Array(nj));
        // grid.forEach((item, index) => {
        //     console.log(item);
        //     item = builder.get(index);
        // });
        // console.log("grid", grid);
        let interpolate = function(x,y){
            let fi = Math.floor(x / Δx),
                fj = Math.floor(y / Δy),
                dx = 0.3,
                dy = 0.3;
            try{
                return builder.interpolate(dx, dy, grid[fi][fj], grid[fi+1][fj], grid[fi][fj+1],grid[fi+1][fj+1]);
            }catch(e){
                return null;
            }
        };

        let sphere_interpolate = function(lambda, phi){
            let i = floodMod(lambda - x0, 360) / Δx;
            let j = (y0 - phi) / Δy;

            let fi = Math.floor(i), ci = fi + 1;
            let fj = Math.floor(j), cj = fj + 1;

            function floodMod(a, n){
                let f = a - n * Math.floor(a / n);
                return f === n ? 0 : f;
            }

            let row;
            if((row = grid[fi])){
                let g00 = row[fi];
                let g10 = row[ci];

            }

        };

        return {
            data: {
                s:grid
            },
            interpolate: interpolate,
        };

        // callback({
        //     data: {
        //         s: grid
        //     },
        //     interpolate: interpolate
        // });
    };
    let animate = function(grid, bounds){
        console.log("Test animate");
        let isValue = function(x){
            return x !== null && x !== undefined;
        };

        // Colors
        function asColorStyle(r, g, b, a){
            return "rgba(" + 243 + ", " + 243 + ", " + 238 + ", " + a + ")";
        }
        function cutHex(h){
            return h.charAt(0)=="#" ? h.substring(1,7) : h;
        }
        function hexToR(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substring(0, 2), 16);
        }
        function hexToG(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substring(2, 4), 16);
        }
        function hexToB(h) {
            // substring(start, stop(default = end)) 用來切文字 從 start 切到 stop
            return parseInt((cutHex(h)).substring(4, 6), 16);
        }
        function IntensityColorScale(maxWind){
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
            result.indexFor = function(m){
                return Math.floor(Math.min(m, maxWind) / maxWind * (result.length - 1));
            };
            return result;
        }

        let colorStyles = IntensityColorScale(MAX_INTENSITY);
        const fadeFillStyle = "rgba(0,0,0, 0.99)";
        const particleCount = Math.round(bounds[1][0] * bounds[1][1] * PARTICLE_MULTIPLIER);
        let buckets = colorStyles.map(()=> { return [];});
        let particles = [];
        // 建出 particle 給 d3 繪圖用
        for (let i = 0; i < particleCount; i++){
            let _x = Math.random() * bounds[1][0],
                _y = Math.random() * bounds[1][1],
                __data__ = grid.interpolate(_x, _y);
            if (isValue(__data__)){
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
        function evolve(){
            buckets.forEach((item)=>{ item.length = 0;});
            particles.forEach((item)=>{
                if (item.age > MAX_PARTICLE_AGE){
                    item.x = item.sx;
                    item.y = item.sy;
                    item.age = 0;
                }
                let __data__ = grid.interpolate(item.x, item.y);
                if (isValue(__data__)){
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

        function draw(){
            // Fade existing particle trails.
            let prev = g.globalCompositeOperation;
            g.globalCompositeOperation = "destination-in";
            g.fillRect(bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]);
            g.globalCompositeOperation = prev;
            // Draw new particle trails.
            buckets.forEach((bucket, i) => {
                if (bucket.length > 0){
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

        setInterval(() => {
            evolve();
            draw();
        }, 0);

        // d3.timer(() => {
        //     evolve();
        //     draw();
        // });

    };

    let start = function(bounds) {
        buildGrid(params.data, function(grid){
            animate(grid, bounds);
        });
    };

    let vector_snake = {
        start: start,
        grid_layout: buildGrid(params.data),
    };

    return vector_snake;
};


// module.exports = {
//     Vector_snake: Vector_snake,
// };