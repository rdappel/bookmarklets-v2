(async () => {

    const response = await fetch('https://gist.githubusercontent.com/RDAppel/f1fe04327236317db29f2918362491c2/raw/cfd60a96aa27179c77c39e21cc79c8efaaec6255/test-style.css')

    const style = document.createElement('style')
    style.innerHTML = await response.text()

    document.head.appendChild(style)

})()