(async () => {

/* CONFIG FUNCTIONS */
// If we change LMS, hopefully we only need to change these functions

const checkSvg = '<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 24 24"><path d="M 20.292969 5.2929688 L 9 16.585938 L 4.7070312 12.292969 L 3.2929688 13.707031 L 9 19.414062 L 21.707031 6.7070312 L 20.292969 5.2929688 z"></path></svg>'
const deleteSvg = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" fill="#000000" version="1.1" id="Capa_1" width="16" height="16" viewBox="0 0 482.428 482.429" xml:space="preserve"><g><g><path d="M381.163,57.799h-75.094C302.323,25.316,274.686,0,241.214,0c-33.471,0-61.104,25.315-64.85,57.799h-75.098    c-30.39,0-55.111,24.728-55.111,55.117v2.828c0,23.223,14.46,43.1,34.83,51.199v260.369c0,30.39,24.724,55.117,55.112,55.117    h210.236c30.389,0,55.111-24.729,55.111-55.117V166.944c20.369-8.1,34.83-27.977,34.83-51.199v-2.828    C436.274,82.527,411.551,57.799,381.163,57.799z M241.214,26.139c19.037,0,34.927,13.645,38.443,31.66h-76.879    C206.293,39.783,222.184,26.139,241.214,26.139z M375.305,427.312c0,15.978-13,28.979-28.973,28.979H136.096    c-15.973,0-28.973-13.002-28.973-28.979V170.861h268.182V427.312z M410.135,115.744c0,15.978-13,28.979-28.973,28.979H101.266    c-15.973,0-28.973-13.001-28.973-28.979v-2.828c0-15.978,13-28.979,28.973-28.979h279.897c15.973,0,28.973,13.001,28.973,28.979    V115.744z"/><path d="M171.144,422.863c7.218,0,13.069-5.853,13.069-13.068V262.641c0-7.216-5.852-13.07-13.069-13.07    c-7.217,0-13.069,5.854-13.069,13.07v147.154C158.074,417.012,163.926,422.863,171.144,422.863z"/><path d="M241.214,422.863c7.218,0,13.07-5.853,13.07-13.068V262.641c0-7.216-5.854-13.07-13.07-13.07    c-7.217,0-13.069,5.854-13.069,13.07v147.154C228.145,417.012,233.996,422.863,241.214,422.863z"/><path d="M311.284,422.863c7.217,0,13.068-5.853,13.068-13.068V262.641c0-7.216-5.852-13.07-13.068-13.07    c-7.219,0-13.07,5.854-13.07,13.07v147.154C298.213,417.012,304.067,422.863,311.284,422.863z"/></g></g></svg>'

const getCourseId = () => document.querySelector('#crumb_1')?.textContent.trim().split(' ').slice(0, -1).join(' ')
const getAssignmentId = () => document.querySelector('#pageTitleText')?.textContent
const getExpandButton = () => document.querySelector('#currentAttempt_gradeDataPanelLink')
const getStudentName = () => document.querySelector('#panelbutton2 > div > div.user-navigator > div.students-pager > h3 > span:nth-child(3)')?.innerText.split(' (Attempt')[0]
const getPointsInput = () => document.querySelector('#currentAttempt_grade')
const getMaxPoints = () => document.querySelector('#currentAttempt_pointsPossible').textContent.slice(1)
const getSubmitButton = () => document.querySelector('#currentAttempt_submitButton')


const getFeedbackPanel = async (attempts = 0) => {
	return new Promise((resolve, reject) => {
		const iframe = document.querySelector('#feedbacktext_ifr')
		if (iframe) resolve(iframe.contentWindow.document.querySelector('#tinymce'))
		else {
			if (attempts > 10) {
				reject('Could not find feedback iframe')
				return
			}

			setTimeout(() => resolve(getFeedbackPanel(attempts + 1)), 250)
		}
	})
}

/* END CONFIG */

const download = (content, filename, type = 'text/plain') => {
	const a = document.createElement('a')
	const file = new Blob([content], { type })
	a.href = URL.createObjectURL(file)
	a.download = filename
	a.click()
}


window.heldKeys = window.heldKeys || { }
document.addEventListener('keydown', e => window.heldKeys[e.code] = true)
document.addEventListener('keyup', e => delete window.heldKeys[e.code])

if (window.heldKeys['KeyE']) {
	window.heldKeys = { }
	const content = Object.entries({...localStorage}).filter(([k]) => k.startsWith('feedback-'))
	download(JSON.stringify(content, null, 2), 'feedback.json', 'application/json')
	return
}

let afterImport = null
let importing = false
if (window.heldKeys['KeyI']) {
	importing = true
	window.heldKeys = { }
	const dropPanel = document.createElement('div')
	dropPanel.classList.add('drop')
	const p = document.createElement('p')
	p.textContent = 'Drop feedback.json here.'
	dropPanel.append(p)
	document.body.append(dropPanel)
	
	const onDrop = ('drop', async e => {
		e.preventDefault()
		e.bubbles = false
		const file = e.dataTransfer.files[0]
		const text = await file.text()
		const json = JSON.parse(text)
		dropPanel.remove()
		if (confirm('Are you sure you want to overwrite your feedback?') === false) return
		json.forEach(([key, value]) => localStorage.setItem(key, value))
		if (afterImport) afterImport()
		importing = false
	})

	dropPanel.addEventListener('dragover', e => e.preventDefault())
	dropPanel.addEventListener('drop', onDrop)
	dropPanel.addEventListener('click', () => dropPanel.remove())
}

/* STYLES */
const css = `
#feedback-panel{font-family:Arial,sans-serif;background-color:white;position:fixed;left:0;right:412px;bottom:0;height:30%;border:1px solid darkgray;padding:12px 48px;z-index:10001;}
#feedback-panel a{underline;cursor:pointer;}
#feedback-panel a:hover{text-decoration:underline;}
#feedback-panel-container{display:flex;flex-direction:row;justify-content:space-between;align-content:stretch;gap:12px;width:100%;height:calc(100% - 24px);border:0;}
.feedback-panel-inner {background-color:#eee;padding:12px;flex-grow:1;min-width:25%;height:100%}
.feedback-panel-inner .items {min-height:75%;overflow-y:scroll;margin-bottom:6px;}
.feedback-panel-inner p {margin:2px;}
.feedback-panel-inner p a {margin-right:1em;}
.feedback-panel-inner .title {font-weight:bold;border-bottom:1px solid black;padding-bottom:2px;margin-bottom:4;text-align:center;}
.feedback-panel-inner button {margin-top:2px;margin-right:2px;}
.drop {position:fixed;top:0;left:0;right:0;bottom:0;background-color:rgba(0,0,0,0.5);display:flex;justify-content:center;align-items:center;font-size:2em;z-index:10002;}
.drop p {background-color:white;padding:24px;border:1px solid black;}
`
/* END STYLES */

const courseId = getCourseId()
const assignmentId = getAssignmentId()
if (!courseId || !assignmentId) return console.error('Could not find course or assignment id')

const style = document.createElement('style')
if (style.styleSheet) style.styleSheet.cssText = css
else style.appendChild(document.createTextNode(css))
document.querySelector('head').appendChild(style)


const feedbackPanelId = 'feedback-panel'
const existing = document.querySelector(`#${feedbackPanelId}`)
if (existing && !importing) {
	const { display } = window.getComputedStyle(existing)
	existing.style.display = display === 'none' ? 'block' : 'none'
	return
}

const key = 'right-to-left'
const rightToLeft = localStorage.getItem(key) || 'false'
localStorage.setItem(key, rightToLeft)

const feedbackKeys = {
	"general": `feedback-general`,
	"course": `feedback-course(${courseId})`,
	"assignment": `feedback-assignment(${courseId}/${assignmentId})`
}

const expandButton = getExpandButton()
if (expandButton.getAttribute('aria-expanded') !== 'true') expandButton.click()

const getFeedback = type => JSON.parse(localStorage.getItem(feedbackKeys[type])) || [ ]
const updateFeedback = (type, feedback) => localStorage.setItem(feedbackKeys[type], JSON.stringify(feedback))

const getAlias = name => {
	const aliases = JSON.parse(localStorage.getItem('aliases')) || { }
	return aliases[name] || name.split(' ')[0]
}
const addAlias = (name, alias) => {
	const aliases = JSON.parse(localStorage.getItem('aliases')) || { }
	aliases[name] = alias
	localStorage.setItem('aliases', JSON.stringify(aliases))
}

const setEndOfContenteditable = editableElement => {
	const range = document.createRange()
	range.selectNodeContents(editableElement)
	range.collapse(false)
	const selection = window.getSelection()
	selection.removeAllRanges()
	selection.addRange(range)
}

const uppercase = text => `${text[0].toUpperCase()}${text.slice(1)}`

const panel = existing || document.createElement('div')
panel.innerHTML = ''
panel.id = feedbackPanelId
panel.classList.add('feedback-panel')
document.body.appendChild(panel)

const container = document.createElement('div')
container.id = 'feedback-panel-container'
panel.appendChild(container)

const feedbackInputPanel = await getFeedbackPanel()

const displayFeedbackItem = (unformattedText, parent, groupKey) => {
	const name = getAlias(getStudentName())
	const nameTag = '{{name}}'
	const formatted = unformattedText.trim().replace(nameTag, name)

	const checkTag = '{{check}}'

	const appendFeedback = () => {
		setEndOfContenteditable(feedbackInputPanel)
		feedbackInputPanel.focus()
		const p = document.createElement('p')
		p.textContent = a.textContent
		feedbackInputPanel.append(p)

		const firstP = feedbackInputPanel.querySelector('p')
		const text = firstP.textContent
		if (text.trim() === '') firstP.remove()
	}

	const p = document.createElement('p')
	parent.append(p)

	const a = document.createElement('a')
	a.innerText = formatted.replace(checkTag, '')
	p.append(a)
	a.addEventListener('click', e => {
		// check if alt is held down
		if (e.altKey) {
			const alias = window.prompt('Enter alias for student', name)
			if (alias) {
				addAlias(getStudentName(), alias)
				generateFeedbackPanels()
			}
		} else appendFeedback()
	})

	if (unformattedText.substring(unformattedText.length - checkTag.length) === checkTag) {
		const a = document.createElement('a')
		a.title = 'Add feedback and submit with full points.'
		a.innerHTML = checkSvg
		p.append(a)
		a.addEventListener('click', () => {
			getPointsInput().value = getMaxPoints()
			appendFeedback()

			setTimeout(() => getSubmitButton().dispatchEvent(new Event('click')), 100)
		})
	}

	const deleteButton = document.createElement('a')
	deleteButton.innerHTML = deleteSvg
	p.append(deleteButton)
	deleteButton.addEventListener('click', () => {
		if (confirm('Are you sure you want to delete this feedback?')) {
			p.remove()
			const feedback = getFeedback(groupKey)
			const index = feedback.indexOf(unformattedText)
			if (index < 0) return
			updateFeedback(groupKey, [...feedback.slice(0, index), ...feedback.slice(index + 1)])
		}
	})
}

const generateFeedbackPanels = () => {
	container.innerHTML = ''

	const keys = Object.keys(feedbackKeys)
	;(rightToLeft === 'true' ? keys.reverse() : keys).forEach(key => {
		const div = document.createElement('div')
		div.classList.add('feedback-panel-inner')
		container.append(div)

		const title = document.createElement('div')
		title.textContent = `${uppercase(key)} Feedback`
		title.classList.add('title')
		div.append(title)

		const items = document.createElement('div')
		items.classList.add('items')
		div.append(items)

		const feedback = getFeedback(key)
		feedback.forEach(feedback => displayFeedbackItem(feedback, items, key))

		const newFeedbackButton = document.createElement('button')
		newFeedbackButton.textContent = `New ${uppercase(key)} Feedback`
		div.append(newFeedbackButton)
		newFeedbackButton.addEventListener('click', () => {
			const message = `Enter feedback text. Use {{name}} to insert student's first name.`
				+ ` Optionally you can add {{check}} to the end and this will add the ability`
				+ ` to auto submit with full credit.`
			const text = window.prompt(message, 'Great job, {{name}}! {{check}}')
			if (!text) return
			displayFeedbackItem(text, items)
			updateFeedback(key, [...getFeedback(key), text])
		})

	})
}

generateFeedbackPanels()
afterImport = generateFeedbackPanels

})()