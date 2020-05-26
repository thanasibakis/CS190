// Segmentation Functions

let determine_num_segments_for = (ts) => {
    if (ts.length < 100)
        return Math.round(0.50 * ts.length)
    else if (ts.length < 200)
        return Math.round(0.35 * ts.length)
    else
        return Math.round(0.25 * ts.length)
}


// SSE of simple linear regression (assuming constant sample rate; treating index as x)
let error_of = (array) => {
    let Xbar = (array.length - 1) / 2
    let Ybar = sum(array) / array.length

    let m = sum(array.map((y, x) => (x - Xbar) * (y - Ybar))) /
        sum(array.map((y, x) => (x - Xbar) ** 2))

    let b = Ybar - m * Xbar

    let yhat = x => m * x + b

    return sum(array.map((y, x) => (y - yhat(x)) ** 2))
}


// Bottom-up algorithm for segmentation (Pazzani 6)
let segmentation_of = (ts, num_segments) => {
    let segments = []
    let costs = []

    // Create initial fine approximation
    for (let i = 0; i < ts.length - 1; i += 2)
        segments.push(ts.slice(i, i + 2))

    // Find cost of merging each pair of segments
    for (let i = 0; i < segments.length - 1; i++)
        costs[i] = error_of(merge_pair(segments, i, i + 1))

    while (segments.length > num_segments) {
        // Find cheapest pair to merge, and do so
        let index = argmin(costs)
        segments[index] = merge_pair(segments, index, index + 1)
        segments.splice(index + 1, 1)
        costs.splice(index, 1)

        // Update cost records
        if (index > 0)
            costs[index - 1] = error_of(merge_pair(segments, index - 1, index))

        costs[index] = error_of(merge_pair(segments, index, index + 1))
    }

    return segments
}


// Helper Functions

// https://gist.github.com/engelen/fbce4476c9e68c52ff7e5c2da5c24a28
let argmin = array => array.map((x, i) => [x, i]).reduce((r, a) => (a[0] < r[0] ? a : r))[1]
let merge_pair = (array, index1, index2) => array[index1].concat(array[index2])
let sum = array => array.reduce((a, b) => a + b)