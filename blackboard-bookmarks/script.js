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

	while (true) {
		const count = prompt('How many bookmarks do you want to add?');
		if (!count) continue;

		[...Array(Number(count)).keys()].forEach(createBookmark);
	}
})()