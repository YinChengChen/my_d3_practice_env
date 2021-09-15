import "./scss/all.scss";
import { createApp, ref, onMounted } from "vue";
// import {select, geoOrthographic, geoPath, json, geoGraticule, timer} from "d3";
import * as d3 from "d3";
import { feature, mesh } from "topojson";
// import { eulerAngles } from "./js/mathFunctions";
import { Vector_snake } from "./js/snake";
// import earthDiagram from "./js/earthDiagram";
import axios from "axios";

const width = 1440;
const height = 1080;
const n_tiles = 20;
// const canvas = d3.select("svg").append("canvas").attr("width", width).attr("height", height);
// foreignObject 設定才能讓 canvas 被 d3 寫入
const svg_element = d3.select("svg").attr("width", width).attr("height", height);
const scale_size = Math.min(width, height) / 3;
const projection = d3.geoOrthographic().scale(scale_size).translate([width/2, height/2]);






const foreignObject = d3.select("svg").append("foreignObject").attr("width", width).attr("height", height);
const canvas = foreignObject.append("xhtml:canvas").attr("xmlns", "http://www.w3.org/2000/xhtml").attr("width", width).attr("height", height);
const content = canvas.node().getContext('2d');
const path = d3.geoPath().projection(projection);
// const context_path = d3.geoPath().projection(projection).context(content);


// console.log(worldData);
// console.log(worldData.objects);




// console.log(content);
// const canvas = d3.select("#pracitce").attr("width", width).attr("height", height);
// console.log(canvas);
// console.log(canvas.node());
let long = d3.range(0, 360, 2.5);
console.log("long", long, long.length);
let lat = d3.range(90, -90, -2.5);
lat.push(-90);
console.log("lat", lat, lat.length);
const params = {
    canvas: canvas.node(),
    data: {
        headers: {
            dx: width / long.length,
            dy: height / lat.length,
            nx: long.length,
            ny: lat.length,
            // dx: width / n_tiles,
            // dy: height / n_tiles,
            // nx: n_tiles,
            // ny: n_tiles,
            x0: 0.0,
            y0: 90.0,
        },
        // Math.pow(number, n) 為 number 的 n次方
        // d3.range(start, stop, step) 從 start 以 step 為間隔到 stop
        // console.log(d3.range(0, 4, 1));
        // d3.map 將陣列轉乘物件，這邊將 d3.range 產生的 0~323作為 index,
        // 賦予 -1 或 1 的值
        //u: d3.range(Math.pow(n_tiles,2)).map(()=>{ return Math.random() < 0.5 ? -1 : 1;}),
        //v: d3.range(Math.pow(n_tiles, 2)).map((d)=>{ return d/n_tiles < n_tiles/2 ? -1 : 1;})
        u: d3.range(long.length*lat.length).map(()=>{ return Math.random() < 0.5 ? -1 : 1;}),
        v: d3.range(long.length*lat.length).map((d)=>{ return d/n_tiles < n_tiles/2 ? -1 : 1;})
    },
};

// console.log(params.canvas);
console.log(params.data);
// console.log(params);
// snake = new Snake(params);
let test_vector = Vector_snake(params);
// console.log(test_vector);
// test_vector.start(
//     [[0,0], [width, height]]
// );

const PARTICLE_MULTIPLIER = 1 / 1000, // 一貞多長
    MAX_INTENSITY = 5, // 線與線的緊密程度
    MAX_PARTICLE_AGE = 300,// 動畫線長度
    PARTICLE_LINE_WIDTH = 10; // 線寬度

// start_animation(test_vector.grid_layout, [[0,0], [width, height]]);


axios.get("https://unpkg.com/world-atlas@1/world/110m.json").then((response) => {
    console.log(response);
    let worldData = response.data;
    svg_element.selectAll(".segment").data(feature(worldData, worldData.objects.countries).features)
        .enter().append("path").attr("class", "segment").attr("d", path).style("stroke", "#ffffff")
        .style("stroke-width", "1px").style("fill", "none");
    start_animation(test_vector.grid_layout, [[0, 0], [width, height]], worldData);
});


function start_animation(grid, bounds, geo_data){
    console.log("Test animate");
    let isValue = function (x) {
        return x !== null && x !== undefined;
    };

    // Colors
    function asColorStyle(r, g, b, a) {
        return "rgba(" + 243 + ", " + 243 + ", " + 238 + ", " + a + ")";
    }
    function cutHex(h) {
        return h.charAt(0) == "#" ? h.substring(1, 7) : h;
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
        let __coord = projection.invert([_x, _y]),
            __coord_data = grid.interpolate(__coord[0], __coord[1]);
        // console.log("x y ", _x, _y);
        // console.log("x y ", __data__);
        // console.log("coord", __coord);
        // console.log("coord", __coord_data);
        if (isValue(__data__)) {
            particles.push({
                // x: __coord_data[0],
                // y: __coord_data[1],
                // m: __coord_data[2],
                // age: Math.floor(Math.random() * MAX_PARTICLE_AGE),
                // xt: __coord[0] - __coord_data[0],
                // xy: __coord[1] - __coord_data[1],
                // sx: __coord[0],
                // sy: __coord[1]
                x: __data__[0],
                y: __data__[1],
                m: __data__[2],
                age: Math.floor(Math.random() * MAX_PARTICLE_AGE),
                xt: _x - __data__[0],
                xy: _y - __data__[1],
                sx: _x,
                sy: _y,
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
    let p = d3.geoPath().projection(projection).context(g);
    g.lineWidth = PARTICLE_LINE_WIDTH;
    g.fillStyle = fadeFillStyle;
    console.log("buckets:", buckets);

    function draw() {

        // 直接使繪製的線段消失
        // g.clearRect(bounds[0][0], bounds[0][1], bounds[1][0], bounds[1][1]);
        // Fade existing particle trails. 慢慢使線段消失
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
                    // console.log(particle.x, particle.y);
                    g.moveTo(particle.x, particle.y);
                    g.lineTo(particle.xt, particle.yt);
                });
                g.stroke();
            }
        });
    }

    // setInterval(() => {
    //     evolve();
    //     draw();
    // }, 0);

    d3.timer(() => {
        evolve();
        draw();
    });

}

// let a = d3.range(0, 4, 1);
// console.log(a);
// let b = a.map(()=> {return Math.random() < 0.5 ? -1 : 1;});
// console.log(b);

// let c = Array(2).fill(1).map(() => Array(4));
// console.log(c);

// let u_wind = Array(n_tiles).fill(1).map(() => Array(n_tiles).fill(1).map((i, index, array) => {
//     // console.log(i, index, array[index]);
//     return Math.random() < 0.5 ? -1 : 1;}));
// console.log("wind", u_wind);


// let d = Array(n_tiles).fill(1).map((i, ii)=>{
//     Array(n_tiles).fill(ii).map((j, jj)=> { return [j,jj];});
//  });
// let c = Array(n_tiles).fill(1).map((i, index) =>{ return index;});
// let d = c.map((i, index)=>{ Array(n_tiles).fill(index);});
// console.log(c);
// let d = Array(n_tiles).fill(1).map(() => Array(n_tiles).fill(a).map((i, index) =>{
//     for (let j = 0; j < i.length; j++){
//         return [i[j], index];
//     }
//     // return [i, index];
// }));
// console.log(d);
// let e = Array(n_tiles).keys().map(() => { Array(n_title);});
// let arr = Array.from(Array(2), () => new Array(4));
// arr[0][0] = 'foo';
// console.info(arr);
// console.log(params.data.v);
// console.log(d3.range(Math.pow(n_tiles, 2)));

