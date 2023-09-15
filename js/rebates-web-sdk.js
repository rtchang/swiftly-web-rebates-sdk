var baseUrl = 'https://rebates.swiftlyapi.net/rebates/active/'

function makeSDK(banner, entity, storageNameOverride) {
	const storageName = storageNameOverride || 'SwiftlyInc';
	return {
		// fetches the thing
		fetch: async () => {
			const request = await fetch(`${baseUrl}${banner}`, {
				headers: {
					"Content-Type": "application/json",
				}
			})
			const result = (await request.json()).activatedRebates
			const dataById = result.reduce((acc, val) => {
			    const rebateId = val.rebateId
				delete val.rebateId
				acc[rebateId] = val;
				return acc;
 			}, {})

			const storage = JSON.parse(window.localStorage[storageName] || '{}')
			window.localStorage[storageName] = JSON.stringify({ ...storage, [entity]: dataById })

			return result
 		},
 		details: (rebateId) => {
			const storage = JSON.parse(window.localStorage[storageName])
			return { ...storage[entity][rebateId], rebateId }
 		},
 		by: (property, value) => {
			const storage = JSON.parse(window.localStorage[storageName] || '{}')
			return Object.keys(storage[entity]).reduce((acc, rebateId) => {
				const rebate = { ...storage[entity][rebateId], rebateId }
				acc[rebate[property]] = (acc[rebate[property]] || []).concat(rebate)
				return acc
			}, {})[value]
 		}
	};
}

window.initializeSwiftly = async (banner) => {
	window.swiftly = {
		login: ({ email, password }) => {
			console.log("email and password login attempted", email, password)
			const token = "something"

			const storage = JSON.parse(window.localStorage[storageName] || '{}')
			window.localStorage[storageName] = JSON.stringify({ ...storage, user: { mail, token } })
		},
		rebates: {
			...makeSDK(banner, 'rebates'),
		}
	};

	const buildCard = (shadow, rebateId) => {
		const rebate = window.swiftly.rebates.details(rebateId)
		const element = document.createElement("div")

		const clipped = false
		const action = clipped ? `<p "text-align: center;">Clipped</p>` : `<button style="border-bottom-right-radius: 16px; border-bottom-left-radius: 16px; width:100%; padding: 8px; border: 0; border-top: 1px solid #000;" onclick="this.disabled=true; this.innerHTML='Clipped'">Clip</button>`;

		element.style = "width: 200px; display: inline-block; border: 1px solid; border-radius: 16px; height: 400px; display: flex; flex-direction: column;";
		element.innerHTML = `
		<span style="color: rgb(61, 129, 41); font-size: 18px; display: block; text-align: center; padding: 8px; height: 40px;">${rebate.brand}</span>
		<span style="color: rgb(61, 129, 41); font-size: 18px; font-weight: 600; display: block; text-align: center; padding: 0 8px 8px 8px;">${rebate.valueDisplay}</span>
		<span style="color: #5b5653; font-size: 13px; display: block; text-align: center; padding: 0 8px 8px 8px; flex-grow: 1;">${rebate.shortDescription}</span>
		<img src="${rebate.imageThumbnailUrl}" role="presentation" style="width: 100%" />
		<div id="swiftly-rebate-${rebate.rebateId}">${action}</div>`;
		shadow.appendChild(element);
	}

	const initTags = async () => {
		const rebateTags = document.querySelectorAll("swiftly-rebates");
		if (!rebateTags.length) {
			return
		}
		await window.swiftly.rebates.fetch()

		rebateTags.forEach(async (tag) => {
			tag.style.display = "block";
			let shadow;
			if (tag.shadowRoot) {
				shadow = tag.shadowRoot;
			} else {
				shadow = tag.attachShadow({ mode: "open" });
			}
			const rebateCategory = tag.getAttribute("category")
			const rebateId = tag.getAttribute("id")

			if (rebateCategory) {
				const rebateCards = window.swiftly.rebates.by("category", rebateCategory)
				const container = document.createElement("div")
				container.style = "display: flex; gap: 16px; flex-wrap: wrap;"

				rebateCards.forEach((rebate) => {
					buildCard(container, rebate.rebateId)
				});
				
				shadow.appendChild(container)
			} else if (rebateId) {
				buildCard(shadow, rebateId)
			}
		});
	};

    if (document.readyState !== "loading") {
      await initTags();
    } else {
      window.addEventListener("DOMContentLoaded", async () => {
        await initTags();
      });
    }
}