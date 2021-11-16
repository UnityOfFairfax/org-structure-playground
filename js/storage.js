/**
 *  @fileoverview Contains all serialization/deserialization and save/load logic.
 */


export const ministriesToJson = (ministriesEl) => {
    const ministryList = []

    ministriesEl.querySelectorAll('.ministry').forEach(el => {
        const ministry = {
            name:           el.querySelector('.name').textContent,
            description:    el.dataset?.description,
            tags:   Array.from(
                            el.querySelectorAll('.tags > li')
                    ).map( el => el.textContent )
        }
        ministryList.push( ministry )
    })
    return ministryList
}

export const groupToJson = (groupEl) => {
    const groupTitle = groupEl.querySelector('dt')
    const groupTags = [
        ...groupTitle.querySelectorAll('.tags > li')
    ]

    const group = {
        name:           groupTitle.querySelector('dt .name').textContent,
        description:    groupTitle.dataset?.description,
        tags:           groupTags.map( el => el.textContent )
    }

    if ([ ...groupEl.querySelectorAll('.ministries li') ].length) {
        group.ministries = ministriesToJson(groupEl.querySelector('.ministries'))
    }

    const subgroups = [ ...groupEl.querySelectorAll('.subgroups > .group') ]
    if (subgroups.length) {
        group.groups = subgroups.map(groupToJson)
    }

    return group
}

export const OrgToJSON = (root) => {
    const result = {
        "ministries": [],
        "groups": []
    }

    for (const el of root.children) {
        if (el.classList.contains('group')) {
            if (el.classList.contains('top-level')) {
                result.ministries = ministriesToJson(el.querySelector('.ministries'))
            }
            else {
                result.groups.push(
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

export const loadFromLocalStorage = (root = document.querySelector('main')) => {
    console.group('loadFromLocalStorage()')

    const rawData = window.localStorage.getItem('data')
    const data    = JSON.parse(rawData)
    console.debug('data', data)

    console.groupEnd()

    return data
}

export const saveToLocalStorage = (root = document.querySelector('main')) => {
    console.group('saveToLocalStorage()')
    
    const data = OrgToJSON(root)
    console.debug('data', data)

    window.localStorage.setItem('data', JSON.stringify(data))
    console.groupEnd()
}

export default {
    ministriesToJson,
    groupToJson,
    OrgToJSON,
    loadFromLocalStorage,
    saveToLocalStorage
}
