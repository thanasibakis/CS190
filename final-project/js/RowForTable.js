/*
    A class for easily building HTML table rows that contain input elements.
*/
let RowForTable = class {
    /*
        Creates a new RowForTable object using "new RowForTable(...)".

        table_element:
            The HTML table element (retrieved with document.getElement...)
            to which this row should be added.
    */
    constructor(table_element) {
        this.row = document.createElement("tr")

        table_element.appendChild(this.row)
    }



    /*
        Add new column(s) to the row, containing a button.

        text:
            The text to be displayed in the button.

        onClick:
            A function to be called when this button is clicked.

        colSpan:
            The number of columns that this input should span.
            Default 1.
    */
    add_button(text, onClick, colSpan = 1) {
        let button = document.createElement("div")
        button.innerHTML = text
        button.onclick = onClick

        this.add(button, colSpan, "button-cell")

        return this
    }



    /*
        Add new column(s) to the row, containing an input label.

        text:
            The text to be displayed by the label.

        htmlFor:
            The ID of the input element to which this label refers.

        colSpan:
            The number of columns that this label should span.
            Default 1.
    */
    add_label(text, htmlFor, colSpan = 1) {
        let label = document.createElement("label")
        label.htmlFor = htmlFor
        label.innerHTML = text

        this.add(label, colSpan)

        return this
    }



    /*
        Add new column(s) to the row, containing a dropdown input.

        id:
            The ID to be assigned to this input.

        options_list:
            A list of values to be shown as options in the dropdown.

        none_option:
            A boolean value, whether or not "None" should be an option
            in the dropdown.
            Default false.

        colSpan:
            The number of columns that this input should span.
            Default 1.
    */
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



    /*
        Add new column(s) to the row, containing a text field.

        id:
            The ID to be assigned to this input.

        default_value:
            The initial value to be contained in the text field.
            Default empty.

        colSpan:
            The number of columns that this input should span.
            Default 1.
    */
    add_text_input(id, default_value = "", colSpan = 1) {
        let text_entry = document.createElement("input")
        text_entry.type = "text"
        text_entry.name = id
        text_entry.id = id
        text_entry.defaultValue = default_value

        this.add(text_entry, colSpan)

        return this
    }



    /*
        Add new column(s) to the row, containing the given element.

        This is a generic method to assist the execution of the others,
        and you likely will not need to use this yourself.

        element:
            The HTML element to be added to the row (created using document.createElement).

        colSpan:
            The number of columns that this element should span.

        className:
            A string containing the class name to assign to the "td" element containing
            the given element.
            Optional.
    */
    add(element, colSpan, className = null) {
        let column = document.createElement("td")
        column.colSpan = colSpan

        if(className)
            column.className = className
        
        column.appendChild(element)
        this.row.appendChild(column)
    }

    

    /*
        Creates an option element to be placed in a dropdown input.

        This is a helper method to assist the execution of the others,
        and you likely will not need to use this yourself.

        value:
            The value that should be assigned to this option element.
    */
    create_option(value) {
        let option = document.createElement('option')
        option.value = value
        option.innerHTML = value

        return option
    }
}