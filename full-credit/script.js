(async () => {

	const key = 'auto-submit'
	const autoSubmit = localStorage.getItem(key) || 'true'
	localStorage.setItem(key, autoSubmit)
	
	const maxPoints = document.querySelector('#currentAttempt_pointsPossible').textContent.slice(1)
    document.querySelector('#currentAttempt_grade').value = maxPoints
    if (autoSubmit) document.querySelector('#currentAttempt_submitButton').dispatchEvent(new Event('click'))
	
})()