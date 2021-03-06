import { geoEquirectangular, geoGraticule10, select } from "d3";
import { wind_color_scale_accurate, isInt } from "./otherTool";
export { params, params_overlay, vector_snake, vector_snake_overlay, longlatlist, wind_overlay_data, bilinear_interpolation };


// function params(data) {
//     const vector_products = {
//         data: {
//             headers: {
//                 dx: data[0].header.dx,
//                 dy: data[0].header.dy,
//                 la1: data[0].header.la1,
//                 la2: data[0].header.la2,
//                 lo1: data[0].header.lo1,
//                 lo2: data[0].header.lo2,
//                 nx: data[0].header.nx,
//                 ny: data[0].header.ny,
//                 refTime: data[0].header.refTime,
//                 unit: data[0].header.gridUnits
//             },
//             u: data[0].data,
//             v: data[1].data,
//         }
//     };
//     return vector_products;
// }
function params(indata) {
    const vector_products = {
        data: {
            headers: {
                dx: indata.header.dx,
                dy: indata.header.dy,
                la1: indata.header.la1,
                la2: indata.header.la2,
                lo1: indata.header.lo1,
                lo2: indata.header.lo2,
                nx: indata.header.nx,
                ny: indata.header.ny,
                refTime: indata.header.refTime,
                unit: indata.header.unit
            },
            u: indata.data.u,
            v: indata.data.v,
        }
    };
    // console.log(vector_products);
    return vector_products;
}

function params_overlay(data){
    const overlay_products = {
        data: {
            headers: {
                dx: data.header.dx,
                dy: data.header.dy,
                la1: data.header.la1,
                la2: data.header.la2,
                lo1: data.header.lo1,
                lo2: data.header.lo2,
                nx: data.header.nx,
                ny: data.header.ny,
                refTime: data.header.refTime,
                unit: data.header.unit
            },
            o: data.data
        }
    };
    return overlay_products;
}

function longlatlist(obj) {
    let longlist = [];
    let latlist = [];
    for (let long of Object.keys(obj)) {
        longlist.push(parseFloat(long));
    }

    for (let lat of Object.keys(obj[0])) {
        latlist.push(parseFloat(lat));
    }
    return [longlist, latlist];
}

function vector_snake(params) {
    let grid = new Object();
    let lat = params.data.headers.la1;
    let long = params.data.headers.lo1;
    let dx = params.data.headers.dx;
    let dy = params.data.headers.dy;

    for (let i = 0; i < params.data.u.length; i++) {
        let u = params.data.u[i];
        let v = params.data.v[i];
        let wind_strength = Number(Math.sqrt(u * u + v * v).toFixed(2));
        // ???????????????????????????
        // if(!isInt(dx) || !isInt(dy)){
        //     let ilong = Math.trunc(long);
        //     let ilat = Math.trunc(lat);
        //     if(!(ilong in grid)){
        //         grid[ilong] = new Object();
        //     }
        //     grid[ilong][ilat] = {
        //         u: u,
        //         v: v,
        //         wind_strength: wind_strength
        //     };
        // }else{
        // // ???????????????
        if (!(long in grid)) {
            grid[long] = new Object();
        }
        grid[long][lat] = {
            u: u,
            v: v,
            wind_strength: wind_strength
        };
        // }

        // Create long, lat list
        // console.log("Each :", long, lat);
        // go to next row
        // ??? long 0~180 ????????? lat
        // ?????? long -179~0 ????????? lat
        // ?????? === -1 ??????????????? lat
        if (long === 180) {
            long = -179;
        } else if (long === -1) {
            lat = lat - dy;
            long = 0;
        } else {
            long = long + dx;
            // lat = lat - dy;
        }
        // console.log(long, lat);
    }
    grid[-180] = grid[180];
    return grid;
}

function vector_snake_overlay(params){
    let grid = new Object();
    let lat = params.data.headers.la1;
    let long = params.data.headers.lo1;
    let dx = params.data.headers.dx;
    let dy = params.data.headers.dy;

    for (let i = 0; i < params.data.o.length; i++) {
        // let u = params.data.u[i];
        // let v = params.data.v[i];
        let strength = params.data.o[i];
        if (!(long in grid)) {
            grid[long] = new Object();
        }
        grid[long][lat] = {
           wind_strength: strength
        };

        if (long === 180) {
            long = -179;
        } else if (long === -1) {
            lat = lat - dy;
            long = 0;
        } else {
            long = long + dx;
            // lat = lat - dy;
        }
    }
    grid[-180] = grid[180];
    return grid;
}

function wind_overlay_data(vector_grid, longlist, latlist, colorbar_scale) {
    const lightness = 0.7;
    const image_width = 4096 / 4;
    const image_height = 2048 / 4;
    const array_size = 4 * image_width * image_height;
    const wind_scale = colorbar_scale;
    const projection_overlay = geoEquirectangular().precision(0.1).fitSize([image_width, image_height], geoGraticule10());
    //TODO
    let overlay_array = new Uint8ClampedArray(array_size);
    let x = 0, y = 0;
    // Need to use loop but first should test data
    for (let i = 0; i < array_size; i = i + 4) {
        const coords = projection_overlay.invert([x, y]);
        if (Math.abs(coords[1]) > 90) {
            console.log(x, y, coords, i, array_size);
        }
        // 0~255 ?????????
        const color = get_color(coords[0], coords[1], longlist, latlist, vector_grid, wind_scale);
        // console.log(color);
        overlay_array[i] = color['red'] * lightness;
        overlay_array[i + 1] = color['green'] * lightness;
        overlay_array[i + 2] = color['blue'] * lightness;
        overlay_array[i + 3] = 200;
        // move to the next pixel
        if (x < image_width - 1) {
            x = x + 1;
        } else {
            x = 0;
            y = y + 1;
        }
        // console.log("Each ", x, y);
    }
    return overlay_array;
}

function get_color(long, lat, longlist, latlist, vector_grid, wind_scale) {
    let wind_strength;
    // console.log(typeof(long), typeof(longlist[0]));
    // console.log(longlist.includes(long));
    if ((longlist.includes(long)) && (latlist.includes(lat))) {
        wind_strength = vector_grid[Math.floor(long)][Math.floor(lat)].wind_strength;
        // console.log('here');
    } else {
        wind_strength = bilinear_interpolation(long, lat, "wind_strength", vector_grid);
    }
    // console.log(wind_strength);
    let color = wind_scale(wind_strength);
    // console.log(color);
    let matchColor = /rgb\((\d{1,3}), (\d{1,3}), (\d{1,3})\)/;
    let match = matchColor.exec(color);
    // console.log("match:", match);
    return {
        "red": parseInt(match[1]),
        "green": parseInt(match[2]),
        "blue": parseInt(match[3]),
    };
}

function bilinear_interpolation(long, lat, field_name, vector_grid) {
    let G1, G2, G3, G4;
    var interpolated_value;
    const i = long;
    const j = lat;
    const f_i = Math.floor(i);
    const c_i = Math.ceil(i);
    const f_j = Math.floor(j);
    const c_j = Math.ceil(j);
    // console.log('bilinear:', f_i, c_i, f_j, c_j);
    try {
        G1 = vector_grid[f_i][f_j][field_name];
        G2 = vector_grid[c_i][f_j][field_name];
        G3 = vector_grid[f_i][c_j][field_name];
        G4 = vector_grid[c_i][c_j][field_name];
    }
    catch (err) {
        console.log(long, lat, field_name);
    }
    const grid_delta_i = 1;
    const grid_delta_j = 1;
    var interpolation_a;
    var interpolation_b;

    if (f_i == c_i) {
        interpolation_a = G1;
        interpolation_b = G3;
    }
    else {
        interpolation_a = (G1 * (c_i - i) / grid_delta_i) + (G2 * (i - f_i) / grid_delta_i);
        interpolation_b = (G3 * (c_i - i) / grid_delta_i) + (G4 * (i - f_i) / grid_delta_i);
    }

    if (f_j == c_j) {
        interpolated_value = (interpolation_a + interpolation_b) / 2;
    }
    else {
        interpolated_value = (interpolation_a * (c_j - j) / grid_delta_j) + (interpolation_b * (j - f_j) / grid_delta_j);
    }
    return interpolated_value;
}

