(async () => {

    const response = await fetch('https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css')
    const data = await response.text()

    console.log(data)


})()