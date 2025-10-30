(() => {

    // ===== Utility Functions =====

    // Shorthand query selector for all matches
    const queryAll = selector => [...document.querySelectorAll(selector)]

    // Get text content safely
    const getText = element =>
        (element?.innerText || element?.textContent || '').trim()

    // Decode Blackboard / SCORM-encoded strings
    const decodeStudentCode = raw => {
        if (!raw) return ''
        let decoded = raw

        // Decode percent-encoding (URL style)
        for (let i = 0; i < 2; i++) {
            if (/%(?:[0-9a-fA-F]{2})/.test(decoded)) {
                try {
                    const next = decodeURIComponent(decoded)
                    if (next === decoded) break
                    decoded = next
                } catch {
                    break
                }
            }
        }

        // Decode HTML entities
        const textarea = document.createElement('textarea')
        for (let i = 0; i < 3; i++) {
            const next = (textarea.innerHTML = decoded, textarea.value)
            if (next === decoded) break
            decoded = next
        }

        // Convert numeric character references
        decoded = decoded.replace(/&#(x[0-9a-fA-F]+|\d+);/g, (_, entity) => {
            try {
                const codePoint = /^x/i.test(entity)
                    ? parseInt(entity.slice(1), 16)
                    : parseInt(entity, 10)
                return String.fromCodePoint(codePoint)
            } catch {
                return _
            }
        })

        // Normalize newlines / tabs
        return decoded
            .replace(/\r\n/g, '\n')
            .replace(/\\r\\n/g, '\n')
            .replace(/\\n/g, '\n')
            .replace(/\\t/g, '\t')
    }

    // Parse a Blackboard timestamp into a Date
    const parseDate = str => {
        const d = new Date(str.replace(/-/g, '/'))
        return isNaN(d) ? new Date(0) : d
    }


    // ===== Extract SCORM Table Data =====

    const rows = queryAll('#scorm-report table.interaction-table tbody tr.row')
    if (!rows.length) {
        alert('No SCORM interaction table found on this page.')
        return
    }

    const submissionPattern = /^(.*?_submission)(?:_(\d+))?\s*\(([^)]+)\)/i
    const metadataPattern = /^(.*?_submission(?:_\d+)?)_metadata\s*\(([^)]+)\)/i

    const submissions = new Map()
    const metadata = new Map()

    for (const row of rows) {
        const title = getText(row.querySelector('td.title')) || ''
        const learnerResponse = getText(row.querySelector('td.learnerResponse')) || ''

        const submissionMatch = title.match(submissionPattern)
        if (submissionMatch) {
            const [, baseId, attemptNumber, timestampText] = submissionMatch
            const submissionId = baseId + (attemptNumber ? `_${attemptNumber}` : '')
            submissions.set(submissionId, {
                id: submissionId,
                timestampText,
                timestamp: parseDate(timestampText),
                rawCode: learnerResponse
            })
            continue
        }

        const metadataMatch = title.match(metadataPattern)
        if (metadataMatch) {
            const [, submissionId, timestampText] = metadataMatch
            let language = 'javascript'
            try {
                const json = JSON.parse(learnerResponse)
                if (json && json.language) language = String(json.language).toLowerCase()
            } catch { }
            metadata.set(submissionId, {
                id: submissionId,
                timestampText,
                timestamp: parseDate(timestampText),
                language
            })
        }
    }

    if (!submissions.size) {
        alert('No submissions found in SCORM table.')
        return
    }


    // ===== Combine Submissions + Metadata =====

    const supportedLanguages = [
        'javascript', 'python', 'csharp', 'java', 'cpp', 'php', 'powershell'
    ]

    const attempts = [...submissions.values()]
        .map(sub => {
            const meta = metadata.get(sub.id)
            let lang = meta?.language || 'javascript'
            if (!supportedLanguages.includes(lang)) lang = 'javascript'
            return {
                id: sub.id,
                timestamp: sub.timestamp,
                timestampText: sub.timestampText,
                rawCode: sub.rawCode,
                language: lang
            }
        })
        .sort((a, b) => b.timestamp - a.timestamp) // most recent first


    // ===== Build Overlay UI =====

    const overlayCSS = `
.__bbMonacoWrap { all: initial; position: fixed; inset: 0; z-index: 2147483647;
  display: flex; align-items: center; justify-content: center; }
.__bbMonacoBack { position: absolute; inset: 0; background: rgba(0,0,0,.6); }
.__bbMonacoCard { position: relative; width: min(96vw,1280px); height: min(90vh,900px);
  background: #1a1a1a; color: #eee; border: 1px solid #333; border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,.7); display: flex; flex-direction: column;
  font: 14px/1.45 system-ui,Segoe UI,Roboto,Helvetica,Arial; color-scheme: dark; }
.__bbMonacoHead { display: flex; gap: 8px; align-items: center; padding: 8px 12px;
  border-bottom: 1px solid #333; background: #111; }
.__bbMonacoHead .t { font-weight: 600; font-size: 13px; }
.__bbMonacoHead .sp { flex: 1; }
.__bbBtn { border: 1px solid #555; background: #222; color: #eee;
  border-radius: 6px; padding: 6px 10px; cursor: pointer; }
.__bbBtn:hover { background: #333; }
.__bbBar { display: flex; gap: 12px; align-items: center; padding: 8px 12px;
  border-bottom: 1px solid #333; background: #141414; }
.__bbSel, .__bbLang { background: #1b1b1b !important; color: #eee !important;
  border: 1px solid #444; border-radius: 6px; padding: 6px 8px; }
.__bbChkLab { display: inline-flex; gap: 8px; align-items: center;
  color: #ccc; white-space: nowrap; }
.__bbChkLab input.__wrap { appearance: auto; -webkit-appearance: checkbox;
  accent-color: #00d0ff; width: 16px; height: 16px; margin-right: 6px;
  outline: 1px solid #666; outline-offset: 1px; background: #111; }
.__bbEditor { flex: 1; margin: 10px; border-radius: 8px; overflow: hidden;
  border: 1px solid #333; background: #0d0d0d; }
.__bbFoot { display: flex; gap: 10px; align-items: center; justify-content: space-between;
  padding: 8px 12px; border-top: 1px solid #333; background: #111; }
.__bbFoot small { opacity: .85; }
`

    const overlayRoot = document.createElement('div')
    overlayRoot.className = '__bbMonacoWrap'

    const styleTag = document.createElement('style')
    styleTag.textContent = overlayCSS
    document.documentElement.appendChild(styleTag)

    const editorContainerId = 'bbm_' + Math.random().toString(36).slice(2)

    overlayRoot.innerHTML = `
    <div class="__bbMonacoBack"></div>
    <div class="__bbMonacoCard">
      <div class="__bbMonacoHead">
        <div class="t">SCORM Attempts (Monaco)</div>
        <div class="sp"></div>
        <button class="__bbBtn" data-action="copy">Copy</button>
        <button class="__bbBtn" data-action="download">Download</button>
        <button class="__bbBtn" data-action="close">Close</button>
      </div>

      <div class="__bbBar">
        <label style="color:#ccc">Attempt:</label>
        <select class="__bbSel" title="Select attempt"></select>

        <div class="sp" style="flex:1"></div>



        <label style="color:#ccc">Lang:</label>
        <select class="__bbLang" title="Language">
          ${supportedLanguages.map(l => {
        const display = {
            javascript: 'JavaScript',
            python: 'Python',
            csharp: 'C#',
            java: 'Java',
            cpp: 'C++',
            php: 'PHP',
            powershell: 'PowerShell'
        }[l]
        return `<option value="${l}">${display}</option>`
    }).join('')}
        </select>
      </div>

      <div id="${editorContainerId}" class="__bbEditor"></div>
      <div class="__bbFoot"><small class="__meta">Loaded.</small></div>
    </div>
  `
    document.body.appendChild(overlayRoot)


    // ===== DOM References =====

    const backdrop = overlayRoot.querySelector('.__bbMonacoBack')
    const attemptSelect = overlayRoot.querySelector('select.__bbSel')
    const languageSelect = overlayRoot.querySelector('select.__bbLang')
    // Removed word wrap checkbox
    const footerMeta = overlayRoot.querySelector('.__meta')

    // Populate attempt list
    const formatAttemptLabel = a =>
        `${a.id.replace(/^.*?_submission_?/, 'submission_')} — ${a.timestampText}`

    attempts.forEach((attempt, index) => {
        const option = document.createElement('option')
        option.value = String(index)
        option.textContent = formatAttemptLabel(attempt)
        attemptSelect.appendChild(option)
    })
    attemptSelect.value = '0'
    languageSelect.value = attempts[0].language


    // ===== Monaco Editor Setup =====

    let editorInstance = null

    const loadMonaco = callback => {
        const LOADER_URL = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs/loader.js'
        const monacoLoaded = window.monaco && window.monaco.editor
        const requireLoaded = typeof window.require === 'function' && window.require.config

        const initMonaco = () => {
            window.require.config({
                paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.2/min/vs' }
            })
            window.require(['vs/editor/editor.main'], () => callback())
        }

        if (monacoLoaded) callback()
        else if (requireLoaded) initMonaco()
        else {
            const script = document.createElement('script')
            script.src = LOADER_URL
            script.onload = initMonaco
            script.onerror = () => alert('Failed to load Monaco editor.')
            document.head.appendChild(script)
        }
    }

    const changeLanguage = lang => {
        if (!editorInstance) return
        const model = editorInstance.getModel()
        window.monaco.editor.setModelLanguage(model, lang)
    }

    const loadAttemptIntoEditor = index => {
        const attempt = attempts[index]
        const decodedCode = decodeStudentCode(attempt.rawCode || '')
        languageSelect.value = attempt.language

        if (editorInstance) {
            editorInstance.setValue(decodedCode)
            changeLanguage(attempt.language)
        } else {
            editorInstance = window.monaco.editor.create(
                document.getElementById(editorContainerId),
                {
                    value: decodedCode,
                    language: attempt.language,
                    theme: 'vs-dark',
                    automaticLayout: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    wordWrap: 'off',
                    scrollBeyondLastLine: false
                }
            )
        }

        footerMeta.textContent = `${attempt.id} • ${attempt.timestampText}`
    }



    const initEditor = () => loadMonaco(() => loadAttemptIntoEditor(Number(attemptSelect.value)))


    // ===== Event Listeners =====

    attemptSelect.addEventListener('change', () => loadAttemptIntoEditor(Number(attemptSelect.value)))
    languageSelect.addEventListener('change', () => changeLanguage(languageSelect.value))


    overlayRoot.addEventListener('click', e => {
        const button = e.target.closest('button.__bbBtn')
        if (!button) return

        const action = button.dataset.action

        if (action === 'close') {
            overlayRoot.remove()
            styleTag.remove()
        } else if (action === 'copy') {
            const value = editorInstance ? editorInstance.getValue() : ''
            navigator.clipboard?.writeText(value).then(() => {
                button.textContent = 'Copied'
                setTimeout(() => (button.textContent = 'Copy'), 900)
            })
        } else if (action === 'download') {
            const value = editorInstance ? editorInstance.getValue() : ''
            const blob = new Blob([value], { type: 'text/plain' })
            const link = document.createElement('a')
            link.href = URL.createObjectURL(blob)
            link.download = 'decoded-code.txt'
            link.click()
            setTimeout(() => URL.revokeObjectURL(link.href), 500)
        }
    })

    backdrop.addEventListener('click', () => {
        overlayRoot.remove()
        styleTag.remove()
    })

    initEditor()

})()
