(async () => {

const { hostname, pathname } = window.location
if (!hostname.includes('github.')) return alert('Not a github site.')

if (hostname === 'github.com') {
	const parts = pathname.split('/')
	window.location = `https://${parts[parts.length - 1]}`
	return
}

const parts = hostname.split('.')
window.location = `https://github.com/${parts[0]}/${hostname}`
	
})()