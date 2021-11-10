const ministriesToJson = (ministriesEl) => {
    const ministryList = []

    ministriesEl.querySelectorAll('.ministry').forEach(el => {
        ministryList.push( el.textContent )
    })
    return ministryList
}

const groupToJson = (groupEl) => {
    const name          = groupEl.querySelector('dt').textContent
    const ministries    = ministriesToJson(groupEl.querySelector('.ministries'))
    const subgroups     = []
    groupEl.querySelectorAll('.subgroups .group').forEach(
        el => subgroups.push(groupToJson(el))
    )

    return { name, ministries, subgroups }
}

const OrgToJSON = (root) => {
    const result = []

    for (const el of root.children) {
        if (el.classList.contains('group')) {
            if (el.classList.contains('top-level')) {
                result.push(
                    ministriesToJson(el.querySelector('.ministries'))
                )
            }
            else {
                result.push(
                    groupToJson(el)
                )
            }
        }
        else {
            console.debug('Skipping element: ', el)
        }
    }

    return result
}
