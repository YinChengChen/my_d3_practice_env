import "./scss/all.scss";
import { createApp, ref, onMounted} from "vue";
// import {select, geoOrthographic, geoPath, json, geoGraticule, timer} from "d3";
import * as d3 from "d3";
import {feature} from "topojson";
import { eulerAngles } from "./js/mathFunctions";
// import earthDiagram from "./js/earthDiagram";
import axios from "axios";

const app = createApp({
    data(){
        return {
            earth_data: {
                showGrid: true,
                rotate: false,
                rotate_setting: {
                    speed: 0.005,
                    verticalTilt: -30,
                    horizontalTilt: 0
                },
            },
            isRotate: false,
            text: "Hello Earth",
            grid_step: [10, 10],
            scale_radio: 2.5,
            wheel_value: 0,
            earth_id: "#earth",
            earth_width: null,
            earth_height: null,
            map_url: "https://unpkg.com/world-atlas@1/world/110m.json",
            worldData: {},
            svg_element: {
                svg: {},
                projection: {},
                path: {},
                scale_size: null,
            },
            isDrag: false,
            origin_position: null,
            new_position: null,
            o0: null,
            earth_rotating:[0,0,0],
        };
    },
    methods:{
        getSvgSize(){
            this.earth_height = this.$refs.earth_svg.clientHeight;
            this.earth_width = this.$refs.earth_svg.clientWidth;
        },
        setGlobe(){
            // 初始寫入圖片資訊到 vue
            this.svg_element.svg = d3.select(this.earth_id);
            // 設定縮放地球大小，讓 svg 知道 earth 可以設多大
            this.svg_element.scale_size = Math.min(this.earth_width, this.earth_height) / this.scale_radio;
            // 設定地球投影置中與球大小
            this.svg_element.projection = d3.geoOrthographic().scale(this.svg_element.scale_size).translate([this.earth_width/2, this.earth_height/2]);
            this.svg_element.path = d3.geoPath().projection(this.svg_element.projection);
        },
        drawMap(){
            let mapData = this.worldData.data;
            this.svg_element.svg.selectAll(".segment").data(feature(mapData, mapData.objects.countries).features)
            .enter().append("path").attr("class", "segment").attr("d", this.svg_element.path).style("stroke", "#ffffff")
            .style("stroke-width", "1px").style("fill", "none");
        },
        drawGraticule(){
            let graticule = d3.geoGraticule().step(this.grid_step);
            this.svg_element.svg.append("path").datum(graticule).attr("class", "graticule").attr("d", this.svg_element.path).style("stroke", "#999999").style("strok_width", "1px").style("fill", "none");
        },
        onWheel(event){
            if(event.deltaY < 0){
                this.scale_radio -= 0.125;
            }else{
                this.scale_radio += 0.125;
            }
        },
        mousedown(event){
           this.isDrag = true;
        //    console.log(eulerAngles([80, 75], [30, 50], [1, 20 ,54]));
        },
        mousemove(event){
            if (this.isDrag){
            }
        },
        mouseup(){
            this.isDrag = false;
            this.svg_element.svg.selectAll(".point").remove();
        },
    },
    computed:{


    },
    watch:{
        earth_data:{
            // 控制格點出現
            handler(){
                if (this.earth_data.showGrid){
                    this.drawGraticule();
                }else{
                    this.svg_element.svg.selectAll(".graticule").remove();
                }
            },
            deep: true
        },
        grid_step:{
            handler(){
                // 偵測格點改變
                if(this.earth_data.showGrid){
                    this.svg_element.svg.selectAll(".graticule").remove();
                    this.drawGraticule();
                }
            },
            deep: true
        },
        scale_radio(){
            this.svg_element.svg.selectAll("*").remove();
            this.setGlobe();
            this.drawMap();
            if (this.earth_data.showGrid){
                this.drawGraticule();
            }
        },
        earth_rotating:{
            handler(){
                this.svg_element.projection.rotate(this.earth_rotating);
                this.svg_element.svg.selectAll("path").attr("d", this.svg_element.path);
            },
            deep: true
        },
        isRotate(){
            console.log(this.isRotate);
            let earth_rotation = d3.timer((elasped)=>{
                let new_earth_rotaing = [this.earth_rotating[0] + elasped * 0.005, this.earth_rotating[1], this.earth_rotating[2]];
                this.svg_element.projection.rotate(new_earth_rotaing);
                this.svg_element.svg.selectAll("path").attr("d", this.svg_element.path);
                if (!this.isRotate) {
                    this.earth_rotating = new_earth_rotaing;
                    earth_rotation.stop();
                }
            });
        }
    },
    mounted() {
        axios.get(this.map_url).then((response) => {
            this.worldData = response;
            this.getSvgSize();
            this.setGlobe();
            if (this.earth_data.showGrid){
                this.drawGraticule();
            }
            this.drawMap();
        });
    },
});
app.mount("#app");
