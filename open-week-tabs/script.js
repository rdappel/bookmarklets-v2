(async () => {

	const weeklyItems = [ ...document.querySelectorAll('ul#courseMenuPalette_contents li') ]
	.filter(li => li.textContent.includes('Week'))
	
	const urls = weeklyItems.map(li => {
		const a = li.querySelector('a')
		return a.href
	})

	// open ulrs in new tabs
	urls.forEach(url => window.open(url, '_blank'))

})()