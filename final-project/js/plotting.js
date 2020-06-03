let plot = null
const MAX_PLOT_WIDTH = 100 // number of points on x-axis to show at a time
const PLOT_MARGIN = 20 // number of points remaining when the plot should scroll

let draw_plot_of = (parameter_map) => {
    let plot_element = document.getElementById("plot")
    
    let data = []

    for(let param of Object.keys(parameter_map))
        data.push({
            label: param,
            data: parameter_map[param].map((value, index) => Object({x: index, y: value})),
            showLine: true,
            fill: false,
            pointRadius: 0,
            borderColor: random_color()
        })

    plot = new Chart(plot_element, {
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

let scroll_plot_if_needed_for = (current_position) => {
    let x_max = plot.options.scales.xAxes[0].ticks.max
    if (x_max - current_position <= PLOT_MARGIN)
        scroll_plot_forward_by(MAX_PLOT_WIDTH - 2 * PLOT_MARGIN)
}

let scroll_plot_forward_by = (amount) => {
    let x_min = plot.options.scales.xAxes[0].ticks.min
    let x_max = plot.options.scales.xAxes[0].ticks.max

    let max_length = plot.data.datasets[0].data.length

    plot.options.scales.xAxes[0].ticks.min = Math.min(x_min+amount, max_length - MAX_PLOT_WIDTH)
    plot.options.scales.xAxes[0].ticks.max = Math.min(x_max+amount, max_length)

    plot.update()
}

let reset_plot = () => {
    plot.options.scales.xAxes[0].ticks.min = 0
    plot.options.scales.xAxes[0].ticks.max = Math.min(MAX_PLOT_WIDTH, plot.data.datasets[0].data.length)

    for(let i = 0; i < plot.data.datasets.length; i++)
        plot.data.datasets[i].pointRadius = 0

    plot.update()
}

let highlight_plot_between_indices = (start_index, end_index) => {
    let get_radius_for_index = (context) => (context.dataIndex >= start_index && context.dataIndex <= end_index) ? 4 : 0

    for(let i = 0; i < plot.data.datasets.length; i++)
        plot.data.datasets[i].pointRadius = get_radius_for_index
    
    plot.update()
}


let random_color = () => {
    let r = Math.round(Math.random() * 155) + 50
    let g = Math.round(Math.random() * 155) + 50
    let b = Math.round(Math.random() * 155) + 50
    return "rgb(" + r + "," + g + "," + b + ")"
}