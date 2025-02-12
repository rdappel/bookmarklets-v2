(async () => {

    const queryString = window.location.search
	const urlParams = new URLSearchParams(queryString)
	const videoId = urlParams.get('v')

	if (!videoId) return
	await navigator.clipboard.writeText(videoId)

})()