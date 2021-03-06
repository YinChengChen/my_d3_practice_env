// 將遇到的 function 或 小元件不知怎分類的放這
import { geoPath, scaleLinear, hsl, rgb, scaleSequential, interpolateViridis, interpolateTurbo, interpolatePiYG, interpolateSinebow, interpolateRdBu } from "d3";
export { setHeight, wind_color_scale_accurate, other_color_scale_accurate, isInt };

function setHeight(projection, width, sphere){
    let [[x0, y0], [x1, y1]] = geoPath(projection.fitWidth(width, sphere)).bounds(sphere);
    const dy = Math.ceil(y1 - y0), l = Math.min(Math.ceil(x1 - x0), dy);
    projection.scale(projection.scale() * (l - 1) / l).precision(0.2);
    return dy;
}

function interpolate_wind_sinebow(t) {
    const end_of_sinebow_scale = 0.3;
    const shift_constant = 0.82;
    const s = scaleLinear().domain([0, end_of_sinebow_scale]).range([0, shift_constant]);
    const end_of_sinebow_scale_color = hsl(rgb(
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 0 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 1 / 3),
        255 * sin2(shift_constant + s(end_of_sinebow_scale) + 2 / 3)
    ));
    const l_scale = scaleLinear().domain([end_of_sinebow_scale, 1]).range([end_of_sinebow_scale_color.l, 1]);
    let parameter = shift_constant + s(t);
    let interpolate_color = rgb(
        255 * sin2(parameter + 0 / 3),
        255 * sin2(parameter + 1 / 3),
        255 * sin2(parameter + 2 / 3)
    );
    if (t > end_of_sinebow_scale) {
        interpolate_color = hsl(end_of_sinebow_scale_color.h, end_of_sinebow_scale_color.s, l_scale(t)) + "";
    }
    // console.log(interpolate_color);
    return interpolate_color;
    // const end_of_sine
}

function sin2(t) {
    return Math.sin(Math.PI * t) ** 2;
}

function wind_color_scale_accurate(max_value) {
    let scale = scaleSequential().domain([0, max_value]).interpolator(interpolate_wind_sinebow);
    // let scale = scaleSequential().domain([0, max_value]).interpolator(interpolateViridis());
    return scale;
};

function other_color_scale_accurate(max_value, view_type){
    let scale;
    if(view_type === "Viridis"){
        scale = scaleSequential(interpolateViridis).domain([0, max_value]);
    }else if(view_type === "Turbo"){
        scale = scaleSequential(interpolateTurbo).domain([0, max_value]);
    } else if (view_type === "PiYG"){
        scale = scaleSequential(interpolatePiYG).domain([0, max_value]);
    } else if (view_type === "Sinebow"){
        scale = scaleSequential(interpolateSinebow).domain([0, max_value]);
    } else if(view_type === "RdBu"){
        scale = scaleSequential(interpolateRdBu).domain([0, max_value]);
    }
    return scale;
}

function isInt(n){
    return typeof n === 'number' && n % 1 == 0;
}