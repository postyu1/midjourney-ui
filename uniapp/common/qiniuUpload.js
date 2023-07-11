
let baseQiniuUrl = "https://upload.qiniup.com/putb64/-1/"
function uploadBase64(base64,token,filePath) {
    return new Promise((resolve,reject)=>{
        let url = baseQiniuUrl
        if(filePath) {
            url += 'key/' + btoa(filePath)
        }
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
          if (xhr.readyState == 4) {
            if (xhr.status >= 200 && xhr.status < 300) {
                var keyText = xhr.responseText;
                keyText = eval('(' + keyText + ')');
                resolve(keyText)
            } else {
                reject(new Error('Request failed with status ' + xhr.status));
            }
            // picUrl = portConstant.imageBaseUrl + keyText.key;
            // _this.toAddFile(picUrl, keyText.key, type)
          } else {
            // console.log(xhr)  
            // reject()
          }
        }
        xhr.open("POST", url, true);
        xhr.setRequestHeader("Content-Type", "application/octet-stream");
        xhr.setRequestHeader("Authorization", "UpToken " + token);
        xhr.send(base64.substring(22));
    })
}
export {uploadBase64}