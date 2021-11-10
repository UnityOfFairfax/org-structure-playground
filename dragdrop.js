let draggedItem     = null
let sortTarget      = null
let isDraggingGroup = false


//-----------------------------------------------------------------
//  Draggable item event handlers
//-----------------------------------------------------------------
function onDragStart(evt) {
    // console.debug('onDragStart', evt)
    const target = (evt.target.nodeName !== '#text')
        ? evt.target
        : evt.target.parentElement

    //  The group’s title is used to drag the group itself
    if (target.nodeName === 'DT' && target.parentElement.classList.contains('group')) {
        draggedItem = target.parentElement
        isDraggingGroup = true
    }
    else {
        draggedItem = target
    }

    evt.dataTransfer.effectAllowed = 'move'
    evt.dataTransfer.setData('text/html',  draggedItem.outerHTML)
    evt.dataTransfer.setData('text/plain', draggedItem.textContent)

    draggedItem.classList.add('dragging')
}

//  fired continuously (every few hundred milliseconds) while dragging
function onDrag(evt) {
    // console.group('onDrag')
    // console.debug('onDrag', evt)
    // const target = evt.target
    // const currentTarget = evt.currentTarget
    // console.debug('onDrag evt.currentTarget', currentTarget)
    // console.groupEnd()
}

//  fired on dropping, or by cancellation (e.g., hitting Esc key)
//  always fires, even for unsuccessful drops
function onDragEnd(evt) {
    // console.debug('onDragEnd',evt)
    draggedItem.classList.remove('dragging')
    draggedItem = null
    isDraggingGroup = false
    document.querySelectorAll('.sort-target')
        .forEach( el => el.classList.remove('sort-target') )
}


//-----------------------------------------------------------------
//  Drop target event handlers
//-----------------------------------------------------------------

//  fired when dragged element enters valid target
function onDragEnter(evt) {
    // console.debug('onDragEnter', evt)
    const dropTarget = evt.target.closest('.group')
    if (dropTarget && !dropTarget.contains(draggedItem)) {
        //  Allow valid drop targets
        evt.preventDefault()

        //  highlight drop target (except when dragging groups onto top-level)
        if (!dropTarget.classList.contains('top-level') && !isDraggingGroup) {
            //  highlight potential drop targets when dragged item enters it
            dropTarget.classList.add('isValid')
        }
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

//  fired continuously while dragged element is over valid target
function onDragOver(evt) {
    // console.group('onDragOver')
    console.debug('draggedItem',    draggedItem?.textContent)
    console.debug('sortTarget',     sortTarget?.textContent)

    const dropTarget = evt.target.closest('.group')

    if (dropTarget) {
        // prevent default to allow drop
        evt.preventDefault()
        evt.dataTransfer.dropEffect = 'move'

        //  Handle sorting list items
        if (!isDraggingGroup) {
            const closestList = evt.target.closest('.ministries > ul')

            if (closestList) {
                const pos = {
                    x: evt.clientX,
                    y: evt.clientY
                }
                sortTarget = getSortTarget(closestList, pos)
                if (sortTarget) {
                    document.querySelector('.sort-target')?.classList.remove('sort-target')
                    sortTarget.classList.add('sort-target')
                }
            }
        }

        //  highlight potential drop targets when dragged item enters it
        //  (except when dragging a group over .top-level)
        if (
            !isDraggingGroup ||
            (
                isDraggingGroup 
                && !dropTarget.classList.contains('top-level') 
                && draggedItem !== dropTarget
            )
        ) {
            dropTarget.classList.add('isValid')
        }
    }

    // console.groupEnd()
}

//  dragged element moves away from valid target
function onDragLeave(evt) {
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
    dropTarget.classList.remove('isValid')
}

//  dragged element is dropped onto valid target
//  only fires on successful drop
function onDrop(evt) {
    // console.debug('onDrop', evt)
    
    //  start `dropTarget` at the group level
    let dropTarget = evt.target.closest('.group')
    if (draggedItem === dropTarget) {
        return true
    }
    // prevent default to allow drop
    evt.preventDefault()

    //  update `dropTarget`...
    //      ...for a dragged ministry
    if (!isDraggingGroup) {
        dropTarget = dropTarget.querySelector('.ministries ul')
    }
    //      ...for a dragged group
    if (isDraggingGroup) {
        sortTarget = null
        //  promote subgroup back to top
        if (dropTarget.classList.contains('top-level')) {
            dropTarget = document.querySelector('main')
        }
        else {
            dropTarget  = dropTarget.querySelector('.subgroups')
        }
    }

    //  move `draggedItem` to its new position
    if (!sortTarget) {
        try {
            dropTarget.append(draggedItem)
        } catch (err) {
            console.error('caught error:')
            console.debug(err)
        }
    } else {
        try {
            dropTarget.insertBefore(draggedItem, sortTarget)
        } catch (err) {
            console.error('caught error:')
            console.debug(err)
        }
    }

    //  cleanup highlighted dropzones
    document.querySelectorAll('.dropzone.isValid')
        .forEach( el => el.classList.remove('isValid') )
}
