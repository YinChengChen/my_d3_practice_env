import "./scss/all.scss";
import myImage from "./images/world.topo.bathy.200401.3x5400x2700.jpg";
import { main, initShaderProgram } from "./js/wegGLfunction";
// import img from "file-loader";
// import { createApp, ref, onMounted} from "vue";
// import {select, geoOrthographic, geoPath, json, geoGraticule, timer} from "d3";
// import * as d3 from "d3";
// import {feature} from "topojson";
// import { eulerAngles } from "./js/mathFunctions";
// import earthDiagram from "./js/earthDiagram";
// import axios from "axios";

// Start 加油
// 測試瀏覽器是否有支援 webgl edge 有支援
const gl = main();
// console.log(gl);
// 呼叫初始化 shader program 來建立 shader program
const vsSource = `
    attribute vec4 aVertexPosition;
    uniform mat4 uModelViewMatrix;
    uniform mat4 uProjectionMatrix;

    void main(){
        gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
    }
`;

const fsSource = `
    void main(){
        gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
    }
`;

const shaderProgram = initShaderProgram(gl, vsSource, fsSource);

// 找到 WebGL 生成出的位置。
// vertex shader 從 buffer 得到下一個值並傳入到 attribute。 Uniform 則像是 Javascript 的全域變數。每次迭代，他們的值不會改變。為了之後方便，我們將 shader 程式與 attribute 和 uniform 存放在同一個物件中
const programInfo = {
    program: shaderProgram,
    attribLocations: {
        vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
    },
    uniformLocations: {
        projectionMatrix: gl.getUniformLocation(shaderProgram, 'uProjectionMatrix'),
        modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
    }
};

// shader 是在 GPU上可以執行的 FUNCTION
// 兩種 : vertex shader, fragment shader
// 每次 vertex shader 給 gl_Position 1到3個值的時候，它會分別畫出點、線、三角形。





// console.log("Hello World");
// async function loadImageAsync(image_source){

//     function getCanvas(img){
//         // let new_canvas = document.createElement("canvas");
//         let new_canvas = document.getElementById("testCanvas");
//         new_canvas.width = img.width;
//         new_canvas.height = img.height;
//         const context = new_canvas.getContext("2d");
//         context.drawImage(img, 0, 0, img.width, img.height);
//         console.log("here");
//         return context.canvas;
//     }

//     return new Promise(function(resolve, reject){
//         const image = new Image();

//         image.onload = function(){
//             resolve(getCanvas(image));
//         };

//         image.onerror = function(){
//             reject(new Error('Could not load image'));
//         };
//         image.src = image_source;

//     });
// }

// // let mySvg = document.getElementById("mySvg");
// let mySvg = d3.select("#mySvg");
// console.log(mySvg);
// loadImageAsync(myImage).then((response) =>{
//     // return response;
//     mySvg.node().appendChild(response);
// });


// let canvas = document.getElementById("myCanvas");
// let svg_element = document.getElementById("mySvg");
// canvas.width = 900;
// canvas.height = 900;
// // canvas.style = "background-color: #ff0000";
// let image = new Image();
// image.src = myImage;
// // let ctxcan = '';
// image.onload = function(){
//     const new_canvas = document.getElementById("testCanvas");
//     // const new_canvas = document.createElement("canvas");
//     new_canvas.width = 4096;
//     new_canvas.height = 2048;
//     const context = new_canvas.getContext("2d");
//     context.drawImage(image, 0, 0, 4096, 2048);
//     // ctxcan = context.canvas;
//     // console.log(ctxcan);
//     // return  context.canvas;
// };




// const app = createApp({
//     data(){
//         return {
//             earth_data: {
//                 showGrid: true,
//                 rotate: false,
//                 rotate_setting: {
//                     speed: 0.005,
//                     verticalTilt: -30,
//                     horizontalTilt: 0
//                 },
//             },
//             isRotate: false,
//             text: "Hello Earth",
//             grid_step: [10, 10],
//             scale_ratio: 2.5,
//             wheel_value: 0,
//             earth_id: "#earth",
//             earth_width: null,
//             earth_height: null,
//             map_url: "https://unpkg.com/world-atlas@1/world/110m.json",
//             worldData: {},
//             svg_element: {
//                 svg: {},
//                 projection: {},
//                 path: {},
//                 scale_size: null,
//             },
//             isDrag: false,
//             origin_position: null,
//             new_position: null,
//             o0: null,
//             earth_rotating:[0,0,0],
//         };
//     },
//     methods:{
//         getSvgSize(){
//             this.earth_height = this.$refs.earth_svg.clientHeight;
//             this.earth_width = this.$refs.earth_svg.clientWidth;
//         },
//         setGlobe(){
//             // 初始寫入圖片資訊到 vue
//             this.svg_element.svg = d3.select(this.earth_id);
//             // 設定縮放地球大小，讓 svg 知道 earth 可以設多大
//             this.svg_element.scale_size = Math.min(this.earth_width, this.earth_height) / this.scale_ratio;
//             // 設定地球投影置中與球大小
//             this.svg_element.projection = d3.geoOrthographic().scale(this.svg_element.scale_size).translate([this.earth_width/2, this.earth_height/2]);
//             this.svg_element.path = d3.geoPath().projection(this.svg_element.projection);
//         },
//         drawMap(){
//             let mapData = this.worldData.data;
//             this.svg_element.svg.selectAll(".segment").data(feature(mapData, mapData.objects.countries).features)
//             .enter().append("path").attr("class", "segment").attr("d", this.svg_element.path).style("stroke", "#ffffff")
//             .style("stroke-width", "1px").style("fill", "none");
//         },
//         drawGraticule(){
//             let graticule = d3.geoGraticule().step(this.grid_step);
//             this.svg_element.svg.append("path").datum(graticule).attr("class", "graticule").attr("d", this.svg_element.path).style("stroke", "#999999").style("strok_width", "1px").style("fill", "none");
//         },
//         onWheel(event){
//             if(event.deltaY < 0){
//                 this.scale_ratio -= 0.125;
//             }else{
//                 this.scale_ratio += 0.125;
//             }
//         },
//         mousedown(event){
//            this.isDrag = true;
//         //    console.log(eulerAngles([80, 75], [30, 50], [1, 20 ,54]));
//         },
//         mousemove(event){
//             if (this.isDrag){
//             }
//         },
//         mouseup(){
//             this.isDrag = false;
//             this.svg_element.svg.selectAll(".point").remove();
//         },
//     },
//     computed:{


//     },
//     watch:{
//         earth_data:{
//             // 控制格點出現
//             handler(){
//                 if (this.earth_data.showGrid){
//                     this.drawGraticule();
//                 }else{
//                     this.svg_element.svg.selectAll(".graticule").remove();
//                 }
//             },
//             deep: true
//         },
//         grid_step:{
//             handler(){
//                 // 偵測格點改變
//                 if(this.earth_data.showGrid){
//                     this.svg_element.svg.selectAll(".graticule").remove();
//                     this.drawGraticule();
//                 }
//             },
//             deep: true
//         },
//         scale_ratio(){
//             this.svg_element.svg.selectAll("*").remove();
//             this.setGlobe();
//             this.drawMap();
//             if (this.earth_data.showGrid){
//                 this.drawGraticule();
//             }
//         },
//         earth_rotating:{
//             handler(){
//                 this.svg_element.projection.rotate(this.earth_rotating);
//                 this.svg_element.svg.selectAll("path").attr("d", this.svg_element.path);
//             },
//             deep: true
//         },
//         isRotate(){
//             console.log(this.isRotate);
//             let earth_rotation = d3.timer((elasped)=>{
//                 let new_earth_rotaing = [this.earth_rotating[0] + elasped * 0.005, this.earth_rotating[1], this.earth_rotating[2]];
//                 this.svg_element.projection.rotate(new_earth_rotaing);
//                 this.svg_element.svg.selectAll("path").attr("d", this.svg_element.path);
//                 if (!this.isRotate) {
//                     this.earth_rotating = new_earth_rotaing;
//                     earth_rotation.stop();
//                 }
//             });
//         }
//     },
//     mounted() {
//         axios.get(this.map_url).then((response) => {
//             this.worldData = response;
//             this.getSvgSize();
//             this.setGlobe();
//             if (this.earth_data.showGrid){
//                 this.drawGraticule();
//             }
//             this.drawMap();
//         });
//     },
// });
// app.mount("#app");
