export { main, initShaderProgram };
function main() {
    const canvas = document.getElementById("glCanvas");
    // 初始化 gl context
    const gl = canvas.getContext("webgl");

    // 當 webgl 有效才繼續

    if (gl === null) {
        alert("無法初始化 webgl");
        return;
    }
    // 設定清除色彩為黑色，完全不透明
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // 透過清除色來清除色彩緩衝區
    gl.clear(gl.COLOR_BUFFER_BIT);
    return gl;
}
// 定義了兩個 shader ，我們接下來要將它們傳入WebGL
// 新增一個 program 將 shader 加入，如果編譯失敗則顯示錯誤訊息
// 初始化 shader 告至 WebGL 怎麼畫
function initShaderProgram(gl, vsSource, fsSource) {
    const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

    // 建立 shader 程式
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    // 錯誤回報
    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
        alert('Unable to initialize the shader program:' + gl.getProgramInfoLog(shaderProgram));
        return null;
    }
    return shaderProgram;
}

// 建立特定 type 的 shader，更新資源與編譯他
function loadShader(gl, type, source) {
    const shader = gl.createShader(type);
    // 將資源送入 shader 物件
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert('An error occurred compiling the shaders:' + gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

// 渲染前，我們要建立一個 buffer 用來儲存頂點的座標。在此我們宣告一個函數 initBuffers() ，隨著之後建立更多複雜的物件，這個動作會重複見到很多次。
function initBuffers(gl){
    // 建立一個 buffer 來儲存正方形座標
    const positionBuffer = gl.createBuffer();
    // 選擇 positionBuffer 作為使用的 buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // 建立新的位置陣列
    // 先做到這邊 https://developer.mozilla.org/zh-TW/docs/Web/API/WebGL_API/Tutorial/Adding_2D_content_to_a_WebGL_context

}