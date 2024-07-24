(async () => {

	const weekDatesExisting = localStorage.getItem('weekDates') || ''
	const dialog = document.querySelector('dialog') || document.createElement('dialog')

	dialog.innerHTML = `
		<p>Set week dates (Separated by line breaks)</p>
		<form method="dialog" style="display:flex;flex-direction:column;">
			<output name="output"></output>
			<textarea name="weekDates" style="min-height:300px">${weekDatesExisting}</textarea>
			<button value="ok" type="submit" autofocus>OK</button>
		</form>
	`

	document.body.appendChild(dialog)
	dialog.showModal()

	// when the form is submitted save to local storage
	dialog.querySelector('form').addEventListener('submit', e => {
		e.preventDefault()

		const weekDates = dialog.querySelector('textarea').value
		localStorage.setItem('weekDates', weekDates)
		dialog.close()
	
		const weekDatesSplit = weekDates?.split('\n') || []

		const weeklyItems = [ ...document.querySelectorAll('ul#courseMenuPalette_contents li') ]
			.filter(li => li.textContent.includes('Week'))

		// add button next to each context menu button
		const mismatches = weeklyItems.map(li => {
			const date = weekDatesSplit.shift().trim()
			if (!date) return
			const span = li.querySelector('a span')
			const text = span?.textContent || ''
			if (text.trim() === date) return

			const { fontWeight, color }  = span.style

			// turn text bold and red
			span.style.fontWeight = 'bold'
			span.style.color = 'red'

			const contextMenuButton = li.querySelector('.contextMenuContainer')
			contextMenuButton.addEventListener('click', async e => {
				// copy the date text to the clipboard
				await navigator.clipboard.writeText(date)
				span.style.fontWeight = fontWeight
				span.style.color = color
			})

			return li
		}).filter(Boolean)

		if (!mismatches.length) return alert('All links are up to date!')
	})

})()