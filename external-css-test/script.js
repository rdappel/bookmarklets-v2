(async () => {

    const response = await fetch('https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css')

    const style = document.createElement('style')
    style.innerHTML = await response.text()

    document.head.appendChild(style)
    
})()