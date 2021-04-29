window.onload = function() {
    fetchSrc([
        {path:'js/main.ts','parent':'main.ts'},
        {path:'js/tile.ts','parent':'tile.ts'},
        {path:'js/player.ts','parent':'player.ts'},
        {path:'js/common.ts','parent':'common.ts'}
    ])
    window.setTimeout(()=>{Prism.highlightAll()},1000)
}
function openTab(evt, tabName) {
    var i, tabcontent, tablinks;
    tabcontent = document.getElementsByClassName("tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
      tabcontent[i].style.display = "none";
    }
    tablinks = document.getElementsByClassName("tablinks");
    for (i = 0; i < tablinks.length; i++) {
      tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(tabName).style.display = "block";
    evt.currentTarget.className += " active";
}
/** 
 * Fetches and implants source file contents into divs.
 * Needs an array of {path: <web path to file>, parent: <id of parent div>} objects
 */
function fetchSrc(srcFiles) {
    srcFiles.forEach(obj => {
        fetch(obj.path,{ headers: {'Content-Type': 'text/plain'}})
            .then(response => response.text())
            .then(text=>{
                document.getElementById(obj.parent).textContent = text
            })
    })
}