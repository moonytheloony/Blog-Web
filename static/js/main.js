function validateKey() {
    var inputValue = document.getElementById('passkey').value;
    var theFrame;
    if (inputValue.length === "5") {
        var completeUrl =
            'https://onedrive.live.com/embed?cid=DFF1B4D9CD55ADCA&resid=DFF1B4D9CD55ADCA%2126211&authkey=' +
                inputValue +
                'vRhKe6BOaU&em=2';
        theFrame = document.getElementById("my_iframe");
        theFrame.src = completeUrl;
        theFrame.style.display = 'block';
    }
    else {
        theFrame.style.display = 'none';
    }
};

function triggerWaypoint(logEventInHeap) {
    var waypoint = new Waypoint({
        element: document.getElementById("waypoint-element"),
        handler: function () {
            if (logEventInHeap) {
                heap.track("Read To End", { post: window.location.pathname });
            } else {
                alert('Event Logged' + window.location.pathname);
            }

            this.destroy();
        }
    });
};

$(document).ready(function () {
    $("a").click(function (e) {
        var fragment = this.href.split("#")[1] || "";
        if (fragment === "subscribe") {
            e.preventDefault();
            $("#subscribeNewsletterModal").modal("show");
        }
        return;
    });
    var subscribeFragment = window.location.hash.substr(1);
    if (subscribeFragment === "subscribe") {
        $("#subscribeNewsletterModal").modal("show");
    }
});

$(document).ready(function () {
    $("#search")
        .submit(function (event) {
            var searchBox = $('[name="q"]');
            if (searchBox.val().trim() === "") {
                $("#search").addClass("has-error");
                event.preventDefault();
            } else {
                $("#search").removeClass("error");
                return;
            }
        });
});

function drawChart(chartArray) {
    google.charts.load("current", { packages: ["corechart"] });
    google.charts.setOnLoadCallback(chart);

    function chart() {
        var data = google.visualization.arrayToDataTable(chartArray);
        var options = { pieHole: 0.4, legend: 'none' };
        var chart = new google.visualization.PieChart(document.getElementById("categoryChart"));
        chart.draw(data, options);
    }
};