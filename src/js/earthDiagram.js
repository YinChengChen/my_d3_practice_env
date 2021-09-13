import {select, geoOrthographic, geoPath, json, geoGraticule, timer} from "d3";
import { feature } from "topojson";

export default function({ earthEl }){
    const earthElement = earthEl.value;
    console.log(earthElement);
    const drawGlobe = (width, height) =>{
        const svg = select(earthElement).attr("width", width).attr("height", height);
        const projection = geoOrthographic();
        const initialScale = projection.scale();
        const path = geoPath().projection(projection);
        let promises = [];
        // 現行的 d3 已經用 Promise 取代 queue 來讀取資料
        promises.push(json("https://unpkg.com/world-atlas@1/world/110m.json"));
        // Promise.all(d3.json, "https://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.jsonhttps://gist.githubusercontent.com/mbostock/4090846/raw/d534aba169207548a8a3d670c9c2cc719ff05c47/world-110m.json")
        // .then();
        Promise.all(promises).then(function(worldData){
        // console.log(worldData);
            svg.selectAll(".segment").data(feature(worldData[0], worldData[0].objects.countries).features)
            .enter().append("path").attr("class", "segment").attr("d", path).style("stroke", "#888")
            .style("stroke-width", "1px").style("fill", (d, i) => '#e5e5e5').style("opacity", ".6");
        });
    };

    return{
        drawGlobe
    }
};