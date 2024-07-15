(async () => {

	const createBookmark = async index => {

		const title = `Bookmark ${index + 1}`;
		const url = prompt(`Enter the URL for ${title}`);

		if (!url) return;

		// firefox
		if (window.sidebar) window.sidebar.addPanel(title, url, '');
		// opera
		else if (window.opera && window.print) {
			const elem = document.createElement('a');
			elem.setAttribute('href', url);
			elem.setAttribute('title', title);
			elem.setAttribute('rel', 'sidebar');
			elem.click();
		}
		// ie
		else if (document.all) window.external.AddFavorite(url, title);
	}

	// only works on course page
	const url = window.location.pathname
	if (!url.includes('/course')) {
		return alert('This script only works on the course pages.');
	}

	while (true) {
		const count = prompt('How many bookmarks do you want to add?');
		if (!count) return;

		[...Array(Number(count)).keys()].forEach(createBookmark);
	}
})()