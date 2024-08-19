(async () => {

	// bb-ultra added an iframe... check for it
	const frame = document.querySelector('iframe.classic-learn-iframe')
	const parent = frame ? frame.contentWindow.document : document


	const key = 'auto-submit'
	const autoSubmit = localStorage.getItem(key) || 'true'
	localStorage.setItem(key, autoSubmit)
	
	const maxPoints = parent.querySelector('#currentAttempt_pointsPossible').textContent.slice(1)
    parent.querySelector('#currentAttempt_grade').value = maxPoints
    if (autoSubmit) parent.querySelector('#currentAttempt_submitButton').dispatchEvent(new Event('click'))
	
})()