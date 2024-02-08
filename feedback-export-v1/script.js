(async () => {

	const download = (content, filename, type = 'text/plain') => {
		const a = document.createElement('a')
		const file = new Blob([content], { type })
		a.href = URL.createObjectURL(file)
		a.download = filename
		a.click()
	}
		
	const getKey = text => `feedback-${text}`

	const getItemKey = (courseId, assignmentId, type) => {
		const feedbackKeys = {
			"feedback": getKey(`general`),
			"courseFeedback": getKey(`course(${courseId})`),
			"assignmentFeedback": getKey(`assignment(${courseId}///${assignmentId})`)
		}

		return feedbackKeys[type]
	}

	const safeJsonParse = item => {
		try { return JSON.parse(item) }
		catch { return item }
	}

	const upgradeV1toV2 = items => {
		return items.map(([key, values]) => {
			const parts = key.replaceAll(' - ', '^*^*^').split('-')
			const type = parts[0].trim()
			const course = parts.slice(parts.length - 1)[0].trim()
			const assignment = parts.slice(1, parts.length - 1).join("-")
				.replaceAll('^*^*^', ' - ').replace('Grade Assignment: ', '').trim()

			const newKey = getItemKey(course, assignment, type)
			if (!newKey) return

			const newValues = JSON.stringify([ safeJsonParse(values) ].flat())
				.replaceAll('{{firstName}}', '{{name}}')

			return [ newKey, newValues ]
		}).filter(Boolean)
	}


	const content = upgradeV1toV2(Object.entries({...localStorage}))
	download(JSON.stringify(content, null, 2), 'feedback-export.json', 'application/json')

})()