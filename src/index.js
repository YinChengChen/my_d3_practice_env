import "./scss/all.scss";
// import myImage from "./images/world.topo.bathy.200401.3x5400x2700.jpg";
// import { main, initShaderProgram } from "./js/wegGLfunction";
import { createApp } from "vue";
// import * as fs from "fs";
// 這行把在 data 裡的資料綁近來
require.context("./data/", true, /^.*/);
import { offcanvas } from "bootstrap";
import axios from "axios";
import { Legend } from "./js/legend";
import { other_color_scale_accurate, setHeight, wind_color_scale_accurate } from "./js/otherTool";
import * as d3 from "d3";
import { feature } from "topojson";
import { createCanvas, initProgram, renderOverlay, drawScene, to_radians } from "./js/webgl_functions";
import { params, vector_snake, longlatlist, wind_overlay_data } from "./js/builder";
import { advance_particle, generate_particles, get_radius_and_center } from "./js/particles";
// import fetch from "node-fetch";

// console.log(data);
const app = createApp({
    data() {
        return {
            // 測試
            text: "My New Earth",
            // Grid 相關
            grid_data: {
                grid_size: [10, 10],
                show_grid: true,
            },
            // data 相關
            mapData: '',
            overlayData: '',
            vectorData: '',
            // image 相關
            vector_overlay: '',
            // Colorbar 相關
            show_colorbar: true,
            colorbar_max_value: 500,
            colorbar_units: "Wind Speed (m/s)",
            colorbar_view: "Sine",
            colorbar_scale: "",
            // Earth 相關
            earthInfo: {
                svg_element: '',
                width: '',
                height: '',
                projection: '',
                path: '',
            },
            scale_ratio: 700,
            // Rotation 相關
            automatic_rotation: false,
            rotation_speed: 0.005,
            manual_rotation_angle: [0, 0, 0],
            // Map 相關
            mapInfo: {
                map_element: '',
                foreignBody: '',
                overlay_canvas: '',
                gl_canvas: '',
                gl_program: '',
                vector_canvas: '',
                radius_and_center: '',
            },
            // 其餘參數
            init_longitude: 0,
            sphere: {
                type: "Sphere"
            },

            // 向量動畫 相關
            vector_animation_play: false,
            show_vector_animation: true,
            vector_frame: '',
            vector_settings: {
                alpha_decay: 0.95,
                particles_travel: 2000,
                number_of_particles: 3500,
                max_age_of_particles: 35,
            },
        };
    },
    methods: {
        //For Data
        async getMapData(url) {
            await axios.get(url).then((response) => {
                this.mapData = response.data;
            });
        },
        async getOverlayData(url) {
            await axios.get(url, {
                baseURL: window.location.origin
            }).then((response) => {
                this.overlayData = response.data;
            });
        },
        //For colorbar
        setLegend() {
            let legend, overlay_scale;
            if (this.colorbar_view === "Sine") {
                overlay_scale = wind_color_scale_accurate(this.colorbar_max_value);
                legend = Legend(overlay_scale, {
                    title: this.colorbar_units
                });
            } else {
                overlay_scale = other_color_scale_accurate(this.colorbar_max_value, this.colorbar_view);
                legend = Legend(overlay_scale, {
                    title: this.colorbar_units
                });
            }
            this.colorbar_scale = overlay_scale;
            let legend_svg = d3.select("#legend").attr("width", 400).attr("height", 100);
            legend_svg.node().appendChild(legend);
        },
        //For earth
        setEarthInfo() {
            this.earthInfo.svg_element = d3.select("#earth");
            this.earthInfo.projection = d3.geoOrthographic().scale(this.scale_ratio).precision(0.1).rotate([-this.init_longitude, 0]);
            this.earthInfo.width = this.earthInfo.svg_element.node().getBoundingClientRect().width;
            this.earthInfo.height = setHeight(this.earthInfo.projection, this.earthInfo.width, this.sphere);
            this.earthInfo.path = d3.geoPath(this.earthInfo.projection);
        },
        // 這邊單獨拆出 map element 創立
        createMapElement() {
            // http://tutorials.jenkov.com/svg/svg-viewport-view-box.html 置中
            this.mapInfo.map_element = d3.create("svg").attr("viewBox", [0, 0, this.earthInfo.width, this.earthInfo.height]).attr("fill", "black").attr("preserveAspectRatio", "xMidYMid").attr("id", "map");
        },
        drawGraticule() {
            this.earthInfo.projection.fitSize([this.earthInfo.width, this.earthInfo.height], d3.geoGraticule10());
            let graticule = d3.geoGraticule().step(this.grid_data.grid_size);
            this.mapInfo.map_element.append("path").datum(graticule).attr("class", "graticule").attr("d", this.earthInfo.path).style("stroke", "#ffffff").attr("stroke-width", 1).style("fill", "none");
        },
        drawMap() {
            // let mapData = this.mapData;
            let land_coastline = feature(this.mapData, this.mapData.objects.countries).features;
            this.mapInfo.map_element.selectAll(".segment").data(land_coastline)
                .enter().append("path").attr("class", "segment").attr("d", this.earthInfo.path).style("stroke", "#ffffff").attr("stroke-width", 1).attr("fill", "none");
        },
        createForeignObject() {
            // 東西先在這邊建，計算在另一個 function
            const foreignObject = this.mapInfo.map_element.append("foreignObject").attr("x", 0).attr("y", 0).attr("width", this.earthInfo.width).attr("height", this.earthInfo.height);
            this.mapInfo.foreignBody = foreignObject.append("xhtml:body").attr("margin", "0px").attr("padding", "0px").attr("background-color", "none").attr("width", this.earthInfo.width + "px").attr("height", this.earthInfo.height + "px");
            this.mapInfo.overlay_canvas = createCanvas(this.earthInfo.width, this.earthInfo.height, "canvas-overlay");
            this.mapInfo.vector_canvas = createCanvas(this.earthInfo.width, this.earthInfo.height, "canvas-particles");
        },
        async initOverlay() {
            const gl = this.mapInfo.overlay_canvas.getContext("webgl");
            // gl = gl;
            if (gl === null) {
                alert("This browser doesn't support webgl");
                return;
            }
            this.mapInfo.foreignBody.node().appendChild(gl.canvas);
            const program = initProgram(gl);
            // this.mapInfo.gl_program = programInfo;
            // const wind_overlay = this.createVectorOverlay();
            this.vectorData = this.createVectorOverlay();
            await this.loadDataToCanvas(this.vectorData.overlay_data);
            renderOverlay(gl, this.vector_overlay, program);
            // let rotate= [0, 0];
            let current_rotation = this.earthInfo.projection.rotate().map(x => to_radians(x));
            // console.log(current_rotation);
            drawScene(gl, program, [current_rotation[0], current_rotation[1]]);

            return {
                gl_canvas: gl,
                gl_program: program,
            };
        },
        initVector() {
            let context_wind_particles = this.mapInfo.vector_canvas.getContext("2d");
            this.mapInfo.foreignBody.node().appendChild(context_wind_particles.canvas);
            let selfs = this;
            this.start_vector_animation(selfs, context_wind_particles);
        },
        start_vector_animation(selfs, context_wind_particles) {
            let wait_time, animation_flag;
            const frame_rate = 30;
            const frame_rate_time = 1000 / frame_rate;
            let particles = [];
            selfs.mapInfo.radius_and_center = get_radius_and_center(selfs.earthInfo.width, selfs.earthInfo.height);
            particles = generate_particles(particles, selfs.vector_settings.number_of_particles, selfs.mapInfo.radius_and_center, selfs.earthInfo.width, selfs.earthInfo.height, selfs.earthInfo.projection, selfs.vector_settings.max_age_of_particles);

            selfs.vector_animation_play = true;
            function tick(t) {
                if (!selfs.vector_animation_play) {
                    return;
                }
                // 畫圖 先畫一張看看
                context_wind_particles.beginPath();
                context_wind_particles.strokeStyle = 'rgba(210, 210, 210, 0.7)';
                particles.forEach((p) => advance_particle(p, context_wind_particles, selfs.mapInfo.radius_and_center, selfs.vector_settings.max_age_of_particles, selfs.vector_settings.particles_travel, selfs.earthInfo.projection, selfs.vectorData.vector_grid));

                context_wind_particles.stroke();
                context_wind_particles.globalAlpha = selfs.vector_settings.alpha_decay;
                context_wind_particles.globalCompositeOperation = 'copy';
                context_wind_particles.drawImage(context_wind_particles.canvas, 0, 0);
                context_wind_particles.globalAlpha = 1.0;
                context_wind_particles.globalCompositeOperation = "source-over";

                wait_time = frame_rate_time - (performance.now() - t);

                animation_flag = setTimeout(() => {
                    selfs.vector_frame = requestAnimationFrame(tick);
                }, wait_time);
            }

            tick(performance.now());
        },
        cancel_vector_animation() {
            // this.show_vector_animation = false;
            this.vector_animation_play = false;
            cancelAnimationFrame(this.vector_frame);
            let context_wind_particles = this.mapInfo.vector_canvas.getContext("2d");
            context_wind_particles.clearRect(0, 0, this.earthInfo.width, this.earthInfo.height);
        },
        restart_vector_animation() {
            // this.show_vector_animation = true;
            let context_wind_particles = this.mapInfo.vector_canvas.getContext("2d");
            let selfs = this;
            this.start_vector_animation(selfs, context_wind_particles);
        },
        // 針對有兩個向量的資料，一個的需要另外寫
        createVectorOverlay() {
            const vector_params = params(this.overlayData);
            const vector_grid = vector_snake(vector_params);
            console.log(vector_grid);
            const [longlist, latlist] = longlatlist(vector_grid);
            console.log(longlist);
            console.log(latlist);
            const overlay_data = wind_overlay_data(vector_grid, longlist, latlist, this.colorbar_scale);
            return {
                vector_grid: vector_grid,
                overlay_data: overlay_data,
            };
        },
        async loadDataToCanvas(wind_overlay) {
            let overlay_width = 1024;
            let overlay_height = 512;
            let overlay_canvas = createCanvas(overlay_width, overlay_height, "overlay");
            let ctx = overlay_canvas.getContext("2d");
            let myImageData = new ImageData(wind_overlay, overlay_width, overlay_height);
            await createImageBitmap(myImageData).then((result) => {
                ctx.drawImage(result, 0, 0, overlay_width, overlay_height);
                this.vector_overlay = ctx.canvas;
            });
        },
        manual_rotation() {
            this.show_vector_animation = false;
            // this.cancel_vector_animation();
            this.earthInfo.projection.rotate(this.manual_rotation_angle);
            let current_rotation = this.earthInfo.projection.rotate().map(x => to_radians(x));
            drawScene(this.mapInfo.gl_canvas, this.mapInfo.gl_program, [current_rotation[0], current_rotation[1]]);
            this.mapInfo.map_element.selectAll(".segment").attr("d", this.earthInfo.path);
            this.mapInfo.map_element.selectAll(".graticule").attr("d", this.earthInfo.path);
        },
        switch_automatic_rotation() {
            let earth_rotation = d3.timer((elasped) => {
                let new_earth_rotating = [this.manual_rotation_angle[0] + elasped * this.rotation_speed, this.manual_rotation_angle[1], this.manual_rotation_angle[2]];
                // this.cancel_vector_animation();
                this.show_vector_animation = false;
                this.earthInfo.projection.rotate(new_earth_rotating);
                let current_rotation = this.earthInfo.projection.rotate().map(x => to_radians(x));
                drawScene(this.mapInfo.gl_canvas, this.mapInfo.gl_program, [current_rotation[0], current_rotation[1]])
                this.mapInfo.map_element.selectAll(".segment").attr("d", this.earthInfo.path);
                this.mapInfo.map_element.selectAll(".graticule").attr("d", this.earthInfo.path);
                if (!this.automatic_rotation) {
                    this.manual_rotation_angle = [Math.trunc(new_earth_rotating[0]), new_earth_rotating[1], new_earth_rotating[2]];
                    this.show_vector_animation = true;
                    earth_rotation.stop();
                }
            });
        },
        zoomEarth() {
            this.show_vector_animation = false;
            // console.log(this.scale_ratio);
            // this.setEarthInfo();
            // this.drawMap();
            this.earthInfo.projection = d3.geoOrthographic().scale(this.scale_ratio).translate([this.earthInfo.width / 2, this.earthInfo.height / 2]);
            this.earthInfo.path = d3.geoPath().projection(this.earthInfo.projection);
            this.mapInfo.map_element.selectAll(".segment").attr("d", this.earthInfo.path);
            this.mapInfo.map_element.selectAll(".graticule").attr("d", this.earthInfo.path);
            // this.mapInfo.radius_and_center = get_radius_and_center(d3.select("#map").node().getBoundingClientRect().width, d3.select("#map").node().getBoundingClientRect().height);
            // this.show_vector_animation = true;
            console.log(d3.select("#canvas-overlay"));
            // let current_rotation = this.earthInfo.projection.rotate().map(x => to_radians(x));
            // let new_width = d3.select("#map").node().getBoundingClientRect().width;
            // let new_height = d3.select("#map").node().getBoundingClientRect().height;
            // let new_radius_and_center = get_radius_and_center(new_width, new_height);
            // console.log(new_width, new_height);
            // this.mapInfo.overlay_canvas.width = d3.select("#map").node().getBoundingClientRect().width;
            // this.mapInfo.overlay_canvas.height = d3.select("#map").node().getBoundingClientRect().height;
            // let new_radius_and_center = get_radius_and_center(this.mapInfo.gl_canvas.width, this.mapInfo.gl_canvas.height);
            // restartSceneScale(this.mapInfo.gl_canvas, this.mapInfo.gl_program, [current_rotation[0], current_rotation[1]], new_radius_and_center);
            // // let scale_width = d3.select("#map").node().getBoundingClientRect().width;
            // let scale_height = d3.select("#map").node().getBoundingClientRect().height;
            // let new_radius_and_center = get_radius_and_center(scale_width, scale_height);

            // console.log(new_radius_and_center);
            // restartSceneScale(this.mapInfo.gl_canvas, this.mapInfo.gl_program, [current_rotation[0], current_rotation[1]], new_radius_and_center, scale_width, scale_height);
            // console.log(d3.select("#map").node().getBoundingClientRect().width);
            // getBoundingClientRect().width
            // this.drawMap();
        },
        async changeScale(){
            this.clearData();
            this.setLegend();
            this.createForeignObject();
            let gl_data = await this.initOverlay();
            this.initVector();
            this.mapInfo.gl_canvas = gl_data.gl_canvas;
            this.mapInfo.gl_program = gl_data.gl_program;
        },
        clearData(){
            this.show_vector_animation = false;
            let legend_svg = d3.select("#legend").attr("width", 400).attr("height", 100);
            legend_svg.selectChild().remove();
            this.mapInfo.map_element.selectAll("foreignObject").remove();
            // this.mapInfo.map_element.node().removeAll();
            this.mapInfo.overlay_canvas = '';
            this.mapInfo.foreignBody = '';
            this.mapInfo.overlay_canvas = '';
            this.mapInfo.gl_canvas = '';
            this.mapInfo.gl_program = '';
            this.mapInfo.vector_canvas = '';
        }

        // onWheel(event){
        //     if(event.deltaY < 0){
        //         this.scale_ratio -= 20;
        //     }else{
        //         this.scale_ratio += 20;
        //     }
        //     this.zoomEarth();
        //     // this.show_vector_animation = true;
        // },
    },
    watch: {
        // async colorbar_max_value() {
        //     let legend_svg = d3.select("#legend").attr("width", 400).attr("height", 100);
        //     legend_svg.selectChild().remove();
        //     this.setLegend();
        //     // 可能不考慮用 colorbar 的 range 而是用輸入的
        //     // 目前還不會 loading 介面的製作
        //     this.mapInfo.map_element.selectAll("foreignObject").remove();
        //     // this.mapInfo.map_element.node().removeAll();
        //     this.createForeignObject();
        //     // this.createVectorOverlay();
        //     let gl_data = await this.initOverlay();
        //     this.initVector();
        //     this.mapInfo.gl_canvas = gl_data.gl_canvas;
        //     this.mapInfo.gl_program = gl_data.gl_program;
        //     // this.renderEarth();
        // },
        grid_data: {
            handler() {
                this.mapInfo.map_element.selectAll(".graticule").remove();
                if (this.grid_data.show_grid) {
                    this.drawGraticule();
                }
            },
            deep: true,
        },
        show_vector_animation() {
            // console.log("Vector animation", this.show_vector_animation);
            if (this.show_vector_animation) {
                this.restart_vector_animation();
            } else {
                this.cancel_vector_animation();
            }
        },
        show_colorbar() {
            if (!this.show_colorbar) {
                let legend = d3.select("#legend").selectAll("*");
                legend.node().remove();
            } else {
                this.setLegend();
            }
        },
        // scale_ratio(){
        //     this.zoomEarth();
        // }
    },
    async mounted() {
        await this.getMapData("https://unpkg.com/world-atlas@1/world/110m.json");
        // await this.getOverlayData("current-wind-surface-level-gfs-1.0.json");
        await this.getOverlayData("2019-08-01-0900-tiegcm-neutralWind-vector-300-gfs.json");
        this.setLegend();
        this.setEarthInfo();

        await this.createMapElement();
        this.drawGraticule();
        this.drawMap();
        this.createForeignObject();
        let gl_data = await this.initOverlay();
        this.initVector();
        // console.log(gl_data);
        this.mapInfo.gl_canvas = gl_data.gl_canvas;
        this.mapInfo.gl_program = gl_data.gl_program;
        this.earthInfo.svg_element.node().append(this.mapInfo.map_element.node());
        // // 全屏keycode 偵測
        // window.addEventListener("keydown", (e) => {
        //     // console.log(e.code);
        //     if (e.code === "KeyR") {
        //         this.automatic_rotation = !this.automatic_rotation;
        //         this.switch_automatic_rotation();
        //     } else {
        //         return;
        //     }
        //     e.preventDefault();
        // });
        // // this.zoomEarth();
    },
});
app.mount("#app");