/*
    Configures the properties of the data visualization.
    
    These typically shouldn't be adjusted.

    MAX_PLOT_WIDTH:
        The range of the x-axis to show on the plot at any given time.
        If data beyond this needs to be seen, the plot should be scrolled.

    PLOT_MARGIN:
        The number of points to remain un-highlighted on the right of the plot.
        When highlighting data, if a point within this margin needs to be
        highlighted, the plot should be scrolled.

*/
const MAX_PLOT_WIDTH = 100
const PLOT_MARGIN = 20



/*
    Draws a line plot of the given data.

    The x-axis values are assumed to be the indices of the data.

    time_series_data:
        An object whose keys are labels for each time series that needs to be plotted
        and whose values are arrays of numbers, corresponding to the actual time series data.
*/
let draw_plot_of = (time_series_data) => {
    let plot_element = document.getElementById("plot")
    
    let data = []

    for(let column of Object.keys(time_series_data))
        data.push({
            label: column,
            data: time_series_data[column].map((value, index) => Object({x: index, y: value})),
            showLine: true,
            fill: false,
            pointRadius: 0,
            borderColor: random_color()
        })

    current_state.plot = new Chart(plot_element, {
        type: 'scatter',
        data: {
            datasets: data
        },
        options: {
            scales: {
                xAxes: [{
                    type: 'linear',
                    position: 'bottom',
                    ticks: {
                        min: 0,
                        max: Math.min(MAX_PLOT_WIDTH, data[0].data.length)
                    }
                }]
            },
            animation: {
                duration: 400
            }
        }
    })
}



/*
    Highlights each data point with an x-axis value between the given values, inclusive.

    start_index:
        A number representing the first value on the x-axis that should see its data point highlighted.

    end_index:
        A number representing the last value on the x-axis that should see its data point highlighted.
*/
let highlight_plot_between_indices = (start_index, end_index) => {
    let get_radius_for_index = (context) => (context.dataIndex >= start_index && context.dataIndex <= end_index) ? 4 : 0

    for(let i = 0; i < current_state.plot.data.datasets.length; i++)
        current_state.plot.data.datasets[i].pointRadius = get_radius_for_index
    
    current_state.plot.update()
}



/*
    Generates the string representation of a random color under the RGB color model.
*/
let random_color = () => {
    let r = Math.round(Math.random() * 155) + 50
    let g = Math.round(Math.random() * 155) + 50
    let b = Math.round(Math.random() * 155) + 50
    return "rgb(" + r + "," + g + "," + b + ")"
}



/*
    Scrolls the plot back to the starting x-axis value, and removes all highlights from data points.
*/
let reset_plot = () => {
    current_state.plot.options.scales.xAxes[0].ticks.min = 0
    current_state.plot.options.scales.xAxes[0].ticks.max = Math.min(MAX_PLOT_WIDTH, current_state.plot.data.datasets[0].data.length)

    for(let i = 0; i < current_state.plot.data.datasets.length; i++)
        current_state.plot.data.datasets[i].pointRadius = 0

    current_state.plot.update()
}



/*
    Scrolls the plot forward along the x-axis by the given amount.

    amount:
        A number representing the length of a range of values on the x-axis.
*/
let scroll_plot_forward_by = (amount) => {
    // Get the minimum and maximum x-axis value currently displayed
    let x_min = current_state.plot.options.scales.xAxes[0].ticks.min
    let x_max = current_state.plot.options.scales.xAxes[0].ticks.max

    // This is how much data we have, so we should ensure that we do not scroll past this
    let max_length = current_state.plot.data.datasets[0].data.length

    current_state.plot.options.scales.xAxes[0].ticks.min = Math.min(x_min+amount, max_length - MAX_PLOT_WIDTH)
    current_state.plot.options.scales.xAxes[0].ticks.max = Math.min(x_max+amount, max_length)

    current_state.plot.update()
}



/*
    Assesses whether the given x-axis value is within the PLOT_MARGIN
    and scrolls the plot if it is.

    current_position:
        A number representing a value on the x-axis.
*/
let scroll_plot_if_needed_for = (current_position) => {
    // Get the maximum x-axis value currently displayed
    let x_max = current_state.plot.options.scales.xAxes[0].ticks.max

    if (x_max - current_position <= PLOT_MARGIN)
        scroll_plot_forward_by(MAX_PLOT_WIDTH - 2 * PLOT_MARGIN)
}