let RowForTable = class {
    constructor(table_element) {
        this.row = document.createElement("tr")

        table_element.appendChild(this.row)
    }

    add_label(text, htmlFor, colSpan = 1) {
        let label = document.createElement("label")
        label.htmlFor = htmlFor
        label.innerHTML = text

        this.add(label, colSpan)

        return this
    }

    add_selector(id, options_list, none_option = false, colSpan = 1) {
        let selector = document.createElement("select")
        selector.name = id
        selector.id = id

        if(none_option)
            selector.appendChild(this.create_option("None"))

        options_list.forEach(value =>
            selector.appendChild(this.create_option(value))
        )

        this.add(selector, colSpan)

        return this
    }

    add_button(text, onClick, colSpan = 1) {
        let button = document.createElement("div")
        button.innerHTML = text
        button.onclick = onClick

        this.add(button, colSpan, "button-cell")

        return this
    }

    add_text_input(id, default_value, colSpan = 1) {
        let text_entry = document.createElement("input")
        text_entry.type = "text"
        text_entry.name = id
        text_entry.id = id
        text_entry.defaultValue = default_value

        this.add(text_entry, colSpan)

        return this
    }

    // Private use only
    add(element, colSpan, className = null) {
        let column = document.createElement("td")
        column.colSpan = colSpan

        if(className)
            column.className = className
        
        column.appendChild(element)
        this.row.appendChild(column)
    }

    create_option(value) {
        let option = document.createElement('option')
        option.value = value
        option.innerHTML = value

        return option
    }
}