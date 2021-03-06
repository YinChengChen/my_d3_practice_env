import "./scss/all.scss";
// import myImage from "./images/world.topo.bathy.200401.3x5400x2700.jpg";
// import { main, initShaderProgram } from "./js/wegGLfunction";
import { createApp } from "vue";
// 這行把在 data 裡的資料綁近來
// require.context("./data/", true, /^.*/);
require.context("../public/data/", true, /^.*/);
import { offcanvas, dropdown } from "bootstrap";
import axios from "axios";
import { Legend } from "./js/legend";
import { other_color_scale_accurate, setHeight, wind_color_scale_accurate } from "./js/otherTool";
import * as d3 from "d3";
import { feature } from "topojson";
// import { drag } from "./js/drag_functions";
import { createCanvas, initProgram, renderOverlay, drawScene, to_radians } from "./js/webgl_functions";
import { params, params_overlay, vector_snake, vector_snake_overlay, longlatlist, wind_overlay_data } from "./js/builder";
import { advance_particle, generate_particles, get_radius_and_center } from "./js/particles";
// import { Versor } from "versor";
import {versor} from "./js/versor_function";
// import { dragstart } from "./js/drag_functions";
// console.log(data);
const app = createApp({
    data() {
        return {
            // Grid 相關
            grid_data: {
                grid_size: [10, 10],
                show_grid: true,
            },
            // data 相關
            year: '2021',
            month: '10',
            day: '23',
            tt: '09',
            info: {
                year: '',
                month: '',
                day: '',
                time: '09',
                model: 'dart',
                vector_type: 'neutralWind',
                overlay_type: 'electronDensity',
                height: '300',
                vector_colorbar_units: "m/s",
                overlay_colorbar_units: "10^5 / cm^3",
                vector_colorbar_scale: "",
                overlay_colorbar_scale: "",
            },
            date_list: '',
            year_list: '',
            month_list: '',
            day_list: '',
            hour: ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"],
            mapData: '',
            landData: '',
            vectorData: '',
            // Colorbar 相關
            vector_show_colorbar: true,
            vector_colorbar_setting: {
                colorbar_max_value: 1000,
                colorbar_view: "Sine",
            },
            overlay_show_colorbar: true,
            overlay_colorbar_setting: {
                colorbar_max_value: 20,
                colorbar_view: "Turbo",
            },
            // Earth 相關
            earthInfo: {},
            scale_ratio: 700,
            // Rotation 相關
            automatic_rotation: false,
            rotation_speed: 0.003,
            manual_rotation_angle: [0, 0, 0],
            overlay_frame: '',
            dec: -1,
            // 其餘參數
            sphere: {
                type: "Sphere"
            },
            // canvas 相關
            canvasInfo: {},
            canvas_data: '',
            // gl 相關
            gl_data: {},
            // 向量動畫 相關
            animation_flag: "",
            vector_animation_play: false,
            show_vector_animation: true,
            vector_frame: '',
            vector_settings: {
                alpha_decay: 0.9,
                particles_travel: 2000,
                number_of_particles: 3000,
                max_age_of_particles: 25,
            },
            layer_settings: {
                rotation_dec: "left",
                animation_type: "vector_type",
            },
        };
    },
    methods: {
        async getData(url){
            const tmpdata = await axios.get(url).then((response) =>{
                return response.data;
            })
            return tmpdata;
        },
        getAllYears(){
            let itemlist = this.date_list;
            let yearList = [];
            // console.log(itemlist);
            itemlist.forEach((item) =>{
                // console.log(item);
                if(yearList.indexOf(item.year) === -1){
                    yearList.push(item.year);
                }
            });
            this.year_list = yearList;
        },
        getAllMonth(selected_year){
            let itemlist = this.date_list;
            let monthList = [];
            itemlist.forEach((item) =>{
                if(item.year === selected_year){
                    if(monthList.indexOf(item.month) === -1){
                        monthList.push(item.month);
                    }
                }
            });
            this.month_list = monthList;
        },
        getAllDay(selected_month){
            let itemlist = this.date_list;
            let tmpyear = this.year;
            itemlist.filter((item) =>{
                if(item.year === tmpyear && item.month === selected_month){
                    this.day_list = item.day;
                }
            });
        },
        getHeight(event){
            this.info.height = event.target.value;
        },
        async init(){
            // let tmp_data = this.loadLocalStorageToInfo("info");
            // if(tmp_data !== null){
            //     this.year = tmp_data.year;
            //     this.month = tmp_data.month;
            //     this.day = tmp_data.day;
            //     this.tt = tmp_data.time;
            // }
            this.date_list = await this.getData("data_diary_dart.json");
            this.mapData = await this.getData("https://unpkg.com/world-atlas@1/world/110m.json");
            this.landData = await this.getData("https://unpkg.com/world-atlas@2.0.2/land-50m.json");
            this.getAllYears();
            this.getAllMonth(this.year);
            this.info.year = this.year;
            this.getAllDay(this.month);
            this.info.month = this.month;
            this.info.day = this.day;
            this.info.time = this.tt;
            // For Vector ColorBar
            let vector_colorbar = this.setLegend(this.vector_colorbar_setting, "vector");
            this.info.vector_colorbar_scale = vector_colorbar.scale;
            d3.select("#vector_legend").node().appendChild(vector_colorbar.legend);
            let overlay_colorbar = this.setLegend(this.overlay_colorbar_setting, "overlay");
            this.info.overlay_colorbar_scale = overlay_colorbar.scale;
            d3.select("#overlay_legend").node().appendChild(overlay_colorbar.legend);
            let div_element = document.getElementById("globe");
            let side = div_element.getBoundingClientRect().height;
            // console.log(div_element.getBoundingClientRect().height);
            div_element.innerHTML = `<svg width='${side}' height='${side}' id='earth'></svg>`;
        },
        async loadData(vector_data, overlay_data){
            let overlayResponse = await this.getData(overlay_data);
            let vectorResponse = await this.getData(vector_data);

            return {
                overlay: overlayResponse,
                vector: vectorResponse
            };
        },
        // For Color Bar
        setLegend(data, type){
            let scale, legend;
            if (data.colorbar_view === "Sine"){
                scale = wind_color_scale_accurate(data.colorbar_max_value);
            }else{
                scale = other_color_scale_accurate(data.colorbar_max_value, data.colorbar_view);
            }
            if (type === "vector"){
                legend = Legend(scale, { title: this.info.vector_colorbar_units});
            } else if (type === "overlay"){
                legend = Legend(scale, { title: this.info.overlay_colorbar_units});
            }
            return {
                scale: scale,
                legend: legend,
            };
        },
        clearNode(node_id){
            d3.select(node_id).selectAll("*").remove();
        },
        addNode(node_id, node){
            d3.select(node_id).node().appendChild(node);
        },
        // Set information of Earth : Width, Height, Project, Path
        setEarthInfo(){
            let earth_svg = document.getElementById("earth");
            let projection = d3.geoOrthographic().precision(0.1).rotate(this.manual_rotation_angle);
            let width = earth_svg.getBoundingClientRect().width;
            // console.log(width);
            // console.log(width / 2);
            let height = setHeight(projection, width, this.sphere);
            let path = d3.geoPath(projection);

            return {
                projection: projection,
                width: width,
                height: height,
                path: path
            };
        },
        // Create Svg Elements
        createSvg(svg_id, width, height){
            let map_svg = d3.create("svg").attr("viewBox", [0, 0, width, height]).attr("fill", "black").attr("preserveAspectRatio", "xMidYMid").attr("id", svg_id);
            return map_svg;
        },
        // Draw Function
        drawGraticule(projection, width, height, path, svg_node){
            projection.fitSize([width, height], d3.geoGraticule10());
            let graticule = d3.geoGraticule().step(this.grid_data.grid_size);
            // return graticule;
            svg_node.append("path").datum(graticule).attr("class", "graticule").attr("d", path).style("stroke", "#ffffff").attr("stroke-width", 1).style("fill", "none");
        },
        drawMap(svg_node, path){
            let coastline = feature(this.mapData, this.mapData.objects.countries).features;
            svg_node.selectAll(".segment").data(coastline).enter().append("path").attr("class", "segment").attr("d", path).style("stroke", "#ffffff").attr("stroke-width", 1).attr("fill", "none");
        },
        getVectorData(vdata){
            const vector_params = params(vdata);
            const vector_grid = vector_snake(vector_params);
            const [longlist, latlist] = longlatlist(vector_grid);
            const vector_data = wind_overlay_data(vector_grid, longlist, latlist, this.info.vector_colorbar_scale);
            return {
                vector_grid: vector_grid,
                vector_overlay: vector_data,
            }
        },
        getOverlayData(odata){
            const overlay_param = params_overlay(odata);
            const overlay_grid = vector_snake_overlay(overlay_param);
            const [longlist, latlist] = longlatlist(overlay_grid);
            const overlay_data = wind_overlay_data(overlay_grid, longlist, latlist, this.info.overlay_colorbar_scale);
            return {
                overlay_grid: overlay_grid,
                overlay_overlay: overlay_data,
            }
        },
        async loadDataToCanvas(data){
            const overlay_width = 1024;
            const overlay_height = 512;
            let overlay_canvas = createCanvas(overlay_width, overlay_height, "canvas_data");
            let ctx = overlay_canvas.getContext("2d");
            let myImageData = new ImageData(data, overlay_width, overlay_height);
            await createImageBitmap(myImageData).then((result) => {
                ctx.drawImage(result, 0, 0, overlay_width, overlay_height);
                this.canvas_data = ctx.canvas;
            });
        },
        // 給 gl 使用的 functions : createForeignObject, createCanvasElement, createGL
        createForeignObject(node){
            // foreignObject 需直接加在 svg 上
            let foreignObject = node.append("foreignObject").attr("x", 0).attr("y", 0).attr("width", this.earthInfo.width).attr("height", this.earthInfo.height);
            let foreignBody = foreignObject.append("xhtml:body").attr("margin", "0px").attr("padding", "0px").attr("background-color", "none").attr("width", this.earthInfo.width + "px").attr("height", this.earthInfo.height + "px");
            return foreignBody;
        },
        createCanvasElement(){
            let overlay_canvas = createCanvas(this.earthInfo.width, this.earthInfo.height, "overlay");
            let vector_canvas = createCanvas(this.earthInfo.width, this.earthInfo.height, "vector");
            this.canvasInfo = {
                vector: vector_canvas,
                overlay: overlay_canvas
            };
        },
        createGL(foreignBody){
            const gl = this.canvasInfo.overlay.getContext("webgl");
            if (gl === null){
                alert("This browser doesn't support webgl");
                return;
            }
            foreignBody.node().appendChild(gl.canvas);
            const program = initProgram(gl);
            // console.log(this.canvas_data);
            renderOverlay(gl, this.canvas_data, program);
            let current_rotation = this.earthInfo.projection.rotate().map(x => to_radians(x));
            drawScene(gl, program, [current_rotation[0], current_rotation[1]]);

            return {
                gl: gl,
                program: program,
            }
        },
        // 給 vector 動畫使用
        createVector(foreignBody){
            const particles_layer = this.canvasInfo.vector.getContext("2d");
            foreignBody.node().appendChild(particles_layer.canvas);
            return particles_layer;
            // this.start_vector_animation(particles_layer, vector_grid);
        },
        start_vector_animation(particles_layer, vector_grid){
            let wait_time;
            let frame_rate = 30;
            let frame_rate_time = 1000 / frame_rate;
            let particles = [];
            let radius_and_center = get_radius_and_center(this.earthInfo.width, this.earthInfo.height);
            particles = generate_particles(particles, this.vector_settings.number_of_particles, radius_and_center, this.earthInfo.width, this.earthInfo.height, this.earthInfo.projection, this.vector_settings.max_age_of_particles);
            this.vector_animation_play = true;
            let selfs = this;
            function tick(t){
                // console.log(t);
                if(!selfs.vector_animation_play){
                    return;
                }
                particles_layer.beginPath();
                particles_layer.strokeStyle = 'rgba(210, 210, 210, 0.7)';
                particles.forEach((p) => advance_particle(p, particles_layer, radius_and_center, selfs.vector_settings.max_age_of_particles, selfs.vector_settings.particles_travel, selfs.earthInfo.projection, vector_grid));
                particles_layer.stroke();
                particles_layer.globalAlpha = selfs.vector_settings.alpha_decay;
                particles_layer.globalCompositeOperation = "copy";
                particles_layer.drawImage(particles_layer.canvas, 0, 0);
                particles_layer.globalAlpha = 1.0;
                particles_layer.globalCompositeOperation = "source-over";

                wait_time = frame_rate_time - (performance.now() - t);
                selfs.animation_flag = setTimeout(() => {
                    selfs.vector_frame = requestAnimationFrame(tick);
                }, wait_time);
            }
            tick(performance.now());

        },
        cancal_vector_animation(){
            this.vector_animation_play = false;
            cancelAnimationFrame(this.vector_frame);
            clearTimeout(this.vector_frame);
            // console.log(this.vector_frame);
            let particles_layer = this.canvasInfo.vector.getContext("2d");
            particles_layer.clearRect(0, 0, this.earthInfo.width, this.earthInfo.height);
        },
        start_automatic_rotation(dec, isRotate){
            let earth_rotation = d3.timer((elasped) => {
                let new_er = [this.manual_rotation_angle[0] + elasped * this.rotation_speed * dec, this.manual_rotation_angle[1], this.manual_rotation_angle[2]];
                this.earthInfo.projection.rotate(new_er);
                let cr = this.earthInfo.projection.rotate().map(x => to_radians(x));
                drawScene(this.gl_data.gl, this.gl_data.program, [cr[0], cr[1]]);
                d3.select("#map").selectAll(".segment").attr("d", this.earthInfo.path);
                d3.select("#map").selectAll(".graticule").attr("d", this.earthInfo.path);
                d3.select("#map").selectAll(".coastline").attr("d", this.earthInfo.path);
                if(!isRotate){
                    earth_rotation.stop();
                }
            });
        },
        saveInfoToLocalStorage(data_name, data){
            // console.log(localStorage.getItem("test"));
            // console.log("save", data_name);
            let tmp_data = JSON.stringify(data);
            // console.log(tmp_data);
            localStorage.setItem(data_name, tmp_data);
        },
        loadLocalStorageToInfo(data_name){
            // console.log(localStorage.getItem(data_name));
            let tmp_data = JSON.parse(localStorage.getItem(data_name));
            // console.log(tmp_data);
            return tmp_data;
        },
        delay(times){
            return new Promise(resolve => setTimeout(resolve, times));
        },
        async auto_play(){
            for (let k = 0; k<50; k++){
                await this.delay(1000).then(()=>{
                    this.automatic_rotation = true;
                });
                await this.delay(10000).then(()=>{
                    this.automatic_rotation = false;
                });
                await this.delay(1000).then(()=>{
                    let particles_layer = this.canvasInfo.vector.getContext("2d");
                    this.start_vector_animation(particles_layer, this.vectorData);
                });
                await this.delay(10000).then(()=>{
                    this.cancal_vector_animation();
                });
            }            
        }
    },
    watch: {
        year(){
            this.getAllMonth(this.year);
            // this.info.year = this.year;
        },
        month(){
            this.getAllDay(this.month);
            // this.info.month = this.month;
        },
        day(){
            this.info.day = this.day;
        },
        grid_data:{
            handler(){
                let map_node = d3.select("#map");
                map_node.selectAll(".graticule").remove();
                if(this.grid_data.show_grid){
                    this.drawGraticule(this.earthInfo.projection, this.earthInfo.width, this.earthInfo.height, this.earthInfo.path, map_node);
                }
            },
            deep: true,
        },
        info:{
            async handler(){
                // 重製圖層
                if(!(d3.select("#map").node() === null)){
                    this.cancal_vector_animation();
                    d3.select("#map").remove();
                }
                let v0, q0, r0;
                let vector_tmpfn = this.info.year + "-" + this.info.month + "-" + this.info.day +
                            "-" + this.info.time + "00-" + this.info.model + "-" +
                            this.info.vector_type + "-vector-" + this.info.height + ".json";
              
                let overlay_tmpfn = this.info.year + "-" + this.info.month + "-" + this.info.day +
                    "-" + this.info.time + "00-" + this.info.model + "-" +
                    "electronDensity" + "-overlay-" + this.info.height + ".json";

              
                console.log(vector_tmpfn);
                console.log(overlay_tmpfn);
                let data  = await this.loadData(vector_tmpfn, overlay_tmpfn);
                let vector_data = this.getVectorData(data.vector);
                let overlay_data = this.getOverlayData(data.overlay);
                this.vectorData = vector_data.vector_grid;
                if (this.info.overlay_type === "electronDensity"){
                    await this.loadDataToCanvas(overlay_data.overlay_overlay);
                }else{
                    await this.loadDataToCanvas(vector_data.vector_overlay);
                }
                
                let earthInfo = this.setEarthInfo();
                this.earthInfo = earthInfo;
               
                let viewBox_svg = this.createSvg("map", earthInfo.width, earthInfo.height);
                let coastline = feature(this.mapData, this.mapData.objects.countries).features;
                let landline = feature(this.landData, this.landData.objects.land).features;
                
                this.drawGraticule(earthInfo.projection, earthInfo.width, earthInfo.height, earthInfo.path, viewBox_svg);
                this.drawMap(viewBox_svg, earthInfo.path);
                viewBox_svg.selectAll(".coastline").data(landline).enter().append("path").attr("class", "coastline").attr("d", earthInfo.path).style("stroke", "#ffffff").attr("stroke-width", 1).attr("fill", "none");

                let foreignBody = this.createForeignObject(viewBox_svg);
                this.createCanvasElement();
                let gl_data = this.createGL(foreignBody);
                this.gl_data = gl_data;
                let particles_layer = this.createVector(foreignBody);
                // this.start_automatic_rotation(gl_data);
                this.start_vector_animation(particles_layer, vector_data.vector_grid);
                let selfs = this;
                // console.log(selfs.automatic_rotation);
                d3.select("#earth").call(d3.drag().on("start", function (e) {
                    // console.log("starting");
                    selfs.cancal_vector_animation();
                    v0 = versor.cartesian(earthInfo.projection.invert([e.x, e.y]));
                    r0 = earthInfo.projection.rotate();
                    q0 = versor(r0);
                    viewBox_svg.selectAll(".segment").remove();
                }).on("drag", function (e) {
                    // console.log("drag");
                    const v1 = versor.cartesian(earthInfo.projection.rotate(r0).invert([e.x, e.y]));
                    const q1 = versor.multiply(q0, versor.delta(v0, v1));
                    const shift_vector = versor.rotation(q1);
                    const shift_vector_adjusted = [shift_vector[0], shift_vector[1], 0];
                    earthInfo.projection.rotate(shift_vector_adjusted);
                    let cr = earthInfo.projection.rotate().map(x => to_radians(x));
                    drawScene(gl_data.gl, gl_data.program, [cr[0], cr[1]]);
                    viewBox_svg.selectAll(".graticule").attr("d", earthInfo.path);
                    viewBox_svg.selectAll(".coastline").attr("d", earthInfo.path);
                }).on("end", function () {
                    viewBox_svg.selectAll(".segment").data(coastline).enter().append("path").attr("class", "segment").attr("d", earthInfo.path).style("stroke", "#ffffff").attr("stroke-width", 1).attr("fill", "none");
                    selfs.manual_rotation_angle = earthInfo.projection.rotate();
                    let particles_layer = selfs.canvasInfo.vector.getContext("2d");
                    selfs.start_vector_animation(particles_layer, selfs.vectorData);
                }));

                d3.select("#earth").node().append(viewBox_svg.node());
                this.saveInfoToLocalStorage("info", this.info);
            },
            deep: true
        },
        vector_colorbar_setting:{
            handler(){
                this.clearNode("#vector_legend");
                let colorbar = this.setLegend(this.vector_colorbar_setting, "vector");
                this.addNode("#vector_legend", colorbar.legend);
                this.info.vector_colorbar_scale = colorbar.scale;
            },
            deep: true
        },
        overlay_colorbar_setting: {
            handler(){
                this.clearNode("#overlay_legend");
                let colorbar = this.setLegend(this.overlay_colorbar_setting, "overlay");
                this.addNode("#overlay_legend", colorbar.legend);
                this.info.overlay_colorbar_scale = colorbar.scale;
            },
            deep: true
        },
        layer_settings:{
            async handler(){
                this.cancal_vector_animation();
                this.automatic_rotation = false;
                if(this.layer_settings.animation_type === "rotate_type"){
                    this.cancal_vector_animation();
                    if(this.layer_settings.rotation_dec === "left"){
                        this.dec = -1;
                        this.automatic_rotation = true;
                    }else{
                        this.dec = 1;
                        this.automatic_rotation = true;
                    }
                }else if(this.layer_settings.animation_type === "vector_type"){
                    this.automatic_rotation = false;
                    this.delay(800).then(()=> {
                        let particles_layer = this.canvasInfo.vector.getContext("2d");
                        this.start_vector_animation(particles_layer, this.vectorData);
                    });
                }else if (this.layer_settings.animation_type === "play_type"){
                   this.auto_play();
                }
            },
            deep: true,
        },
        automatic_rotation(){
            let new_er;
            let earth_rotation = d3.timer((elasped) => {
                new_er = [this.manual_rotation_angle[0] + elasped * this.rotation_speed * this.dec, this.manual_rotation_angle[1], this.manual_rotation_angle[2]];
                this.earthInfo.projection.rotate(new_er);
                let cr = this.earthInfo.projection.rotate().map(x => to_radians(x));
                drawScene(this.gl_data.gl, this.gl_data.program, [cr[0], cr[1]]);
                d3.select("#map").selectAll(".segment").attr("d", this.earthInfo.path);
                d3.select("#map").selectAll(".graticule").attr("d", this.earthInfo.path);
                d3.select("#map").selectAll(".coastline").attr("d", this.earthInfo.path);
                if (!this.automatic_rotation) {
                    this.manual_rotation_angle = new_er;
                    earth_rotation.stop();
                }
            });
        }
    },
    mounted() {
        this.init();
    },
});
app.mount("#app");