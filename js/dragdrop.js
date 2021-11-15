import { throttle, debounce } from './utilities.js'

let draggedItem     = null
let draggedItemType = null
let sortTarget      = null

const _logDragState = (evt) => {
    console.group(`state: ${evt.type}`)
    console.debug('effectAllowed', evt.dataTransfer.effectAllowed)
    console.debug('draggedItem', draggedItem)
    console.debug('draggedItemType', draggedItemType)
    console.debug('sortTarget', sortTarget)
    console.groupEnd()
}

//  To use in continuously-firing event handlers (like `onDragOver`),
//  throttle calls to once every 2 seconds.
const logDragState = throttle(2000, _logDragState)


//-----------------------------------------------------------------
//  Draggable item event handlers
//-----------------------------------------------------------------
export function onDragStart(evt) {
    // console.debug('onDragStart', evt)
    const target = evt.target

    //  The group’s title is used to drag the group itself
    if (target.nodeName === 'DT' && target.parentElement.classList.contains('group')) {
        draggedItem     = target.parentElement
        draggedItemType = 'group'
        sortTarget      = null
        evt.dataTransfer.effectAllowed = 'move'
    }
    if (target.nodeName === 'LI' && target.classList.contains('ministry')) {
        draggedItem     = target
        draggedItemType = 'ministry'
        evt.dataTransfer.effectAllowed = 'move'
    }
    if (target.nodeName === 'LI' && target.parentElement.classList.contains('tags')) {
        draggedItem     = target.cloneNode(true)
        draggedItem.removeAttribute('draggable')
        draggedItem.classList.remove('dragging')
        draggedItemType = 'tag'
        evt.dataTransfer.effectAllowed = 'copy'
    }

    evt.dataTransfer.setData('text/html',  draggedItem.outerHTML)
    evt.dataTransfer.setData('text/plain', draggedItem.textContent)

    draggedItem.classList.add('dragging')

    // logDragState(evt)
}

//  fired continuously (every few hundred milliseconds) while dragging
export function onDrag(evt) {
    // console.group('onDrag')
    // console.debug('onDrag', evt)
    // const target = evt.target
    // const currentTarget = evt.currentTarget
    // console.debug('onDrag evt.currentTarget', currentTarget)
    // console.groupEnd()
}

//  fired on dropping, or by cancellation (e.g., hitting Esc key)
//  always fires, even for unsuccessful drops
export function onDragEnd(evt) {
    // console.debug('onDragEnd',evt)
    draggedItem.classList.remove('dragging')
    document.querySelectorAll('.dragging').forEach( el => el.classList.remove('dragging') )
    document.querySelectorAll('.sort-target').forEach( el => el.classList.remove('sort-target') )
    draggedItem = sortTarget = draggedItemType = null
}


//-----------------------------------------------------------------
//  Drop target event handlers
//-----------------------------------------------------------------

//  fired when dragged element enters valid target
export function onDragEnter(evt) {
    // console.debug('onDragEnter', evt)

    let dropTarget
    switch (draggedItemType) {
        case 'tag':
            if (evt.target.closest('.ministry')) {
                dropTarget = evt.target.closest('.ministry')
            }
            else if (evt.target.closest('dt')) {
                dropTarget = evt.target.closest('dt')
            }

            if (dropTarget) {
                //  Allow valid drop targets
                evt.preventDefault()

                //  highlight potential drop targets when dragged item enters it
                dropTarget.classList.add('isValid')
            }
            break

        case 'ministry':
        case 'group':
            dropTarget = evt.target.closest('.group, #deleted')
            if (dropTarget && !dropTarget.contains(draggedItem)) {
                //  Allow valid drop targets
                evt.preventDefault()

                //  highlight drop target (except when dragging groups onto top-level)
                if (draggedItemType === 'ministry' && !dropTarget.classList.contains('top-level') ) {
                    //  highlight potential drop targets when dragged item enters it
                    dropTarget.classList.add('isValid')
                }
            }
            break

        default:
            break
    }


}

//  Helper for drag-sorting
//      Thanks to Web @DevSimplified video:
//      https://www.youtube.com/watch?v=jfYWwQrtzzY
const getSortTarget = (container, {x, y}) => {
    const draggables = container.querySelectorAll('[draggable]:not(.dragging)')

    const reducer = (closest, el) => {
        const bbox = el.getBoundingClientRect()
        const offset = y - bbox.top - (bbox.height/2)
        if (closest.offset < offset && offset < 0) {
            return { offset, el }
        }
        return closest
    }

    const result = [...draggables].reduce(
        reducer, { offset: Number.NEGATIVE_INFINITY }
    )
    return result.el
}

const updateSortTarget = (evt) => {
    const closestList = evt.target.closest('.ministries > ul')

    if (closestList) {
        const pos = {
            x: evt.clientX,
            y: evt.clientY
        }
        sortTarget = getSortTarget(closestList, pos)

        //  update `.sort-target` CSS class
        if (sortTarget) {
            document.querySelector('.sort-target')?.classList.remove('sort-target')
            sortTarget.classList.add('sort-target')
        }
    }
}

//  fired continuously while dragged element is over valid target
export function onDragOver(evt) {
    // console.debug('onDragOver')

    let dropTarget = evt.target.closest('.group, #deleted')

    if (dropTarget) {
        // prevent default to allow drop
        evt.preventDefault()

        switch (draggedItemType) {
            case 'ministry':
                evt.dataTransfer.dropEffect = 'move'
                //  Handle sorting list items
                updateSortTarget(evt)
                //  highlight potential drop targets
                if (!dropTarget.classList.contains('isValid')) {
                    dropTarget.classList.add('isValid')
                }
                break

            case 'group':
                evt.dataTransfer.dropEffect = 'move'
                //  highlight potential drop targets
                //  (except when dragging over `.top-level`)
                if (
                    !dropTarget.classList.contains('top-level')
                    && draggedItem !== dropTarget
                ) {
                    if (!dropTarget.classList.contains('isValid')) {
                        dropTarget.classList.add('isValid')
                    }
                }
                break

            case 'tag':
                evt.dataTransfer.dropEffect = 'copy'
                break

            default:
                break
        }
    }

    // logDragState(evt)

    // console.groupEnd()
}

//  dragged element moves away from valid target
export function onDragLeave(evt) {
    // console.debug('onDragLeave', evt)
    const dropTarget = evt.target.closest('.group')

    //  reset `sortTarget` if we left a list
    if (evt.target.classList.contains('ministries') ) {
        document.querySelectorAll('.sort-target')
            .forEach( el => el.classList.remove('sort-target') )
        sortTarget = null
    }

    // reset highlighting dropzones when the `draggedItem` leaves it
    evt.target.classList.remove('isValid')
    dropTarget?.classList.remove('isValid')
}

//  dragged element is dropped onto valid target
//  only fires on successful drop
export function onDrop(evt) {
    // console.debug('onDrop', evt)

    //  start `dropTarget` at the group level by default
    let dropTarget = evt.target.closest('.group')

    //  exit now if dropping an item onto itself
    if (draggedItem === dropTarget) {
        return true
    }

    //  check for deletion first
    if (evt.target.closest('#deleted') && draggedItemType !== 'tag') {
        dropTarget = document.querySelector('#deleted ul')
        const li = document.createElement('li')
        li.append(draggedItem)
        dropTarget.append(li)
    }
    else {
        //  update `dropTarget`
        switch (draggedItemType) {
            case 'ministry':
                dropTarget = dropTarget.querySelector('.ministries ul')
                break

            case 'group':
                sortTarget = null
                //  promote subgroup back to top
                if (dropTarget.classList.contains('top-level')) {
                    dropTarget = document.querySelector('main')
                }
                else {
                    dropTarget  = dropTarget.querySelector('.subgroups')
                }
                break

            case 'tag':
                console.debug('dropping a tag')
                sortTarget = null
                dropTarget = evt.target.closest('.ministry, .group dt').querySelector('.tags')
                break

            default:
                console.info('What are we dragging? event: ', evt)
                break
        }

        //  prevent default to allow drop
        if (dropTarget) {
            evt.preventDefault()
        }

        // debugger

        //  move `draggedItem` to its new position
        if (sortTarget) {
            try {
                dropTarget.insertBefore(draggedItem, sortTarget)
            }
            catch (err) {
                dropTarget.append(draggedItem)
            }
        } else {

            //  check whether to add or remove the tag
            if (draggedItemType === 'tag') {
                console.debug('dropTarget', dropTarget)
                console.debug('draggedItem', draggedItem)

                const draggedTagText = draggedItem.textContent.toString()
                const tagEls = [ ...dropTarget.querySelectorAll('li') ]
                const matchingTags = tagEls.filter(
                    el => el.textContent.toString() == draggedTagText
                )

                // debugger

                if (matchingTags.length) {
                    matchingTags.forEach( el => el.remove() )
                }
                else {
                    dropTarget.append(draggedItem)
                }

            }
            else {
                dropTarget.append(draggedItem)
            }

            if (draggedItemType === 'group' && dropTarget.classList.contains('group')) {
                const button = dropTarget.querySelector('button.new-group')
                dropTarget.append(button)
            }
        }
    }

    //  cleanup highlighted dropzones
    document.querySelectorAll('.dropzone.isValid')
        .forEach( el => el.classList.remove('isValid') )

    //  prevent any odd duplicate `drop` events
    //  (I don’t know the precise cause, but this solves the issue...)
    evt.stopPropagation()
}

export default {
    onDragStart,
    onDrag,
    onDragEnd,

    onDragEnter,
    onDragOver,
    onDragLeave,
    onDrop
}
