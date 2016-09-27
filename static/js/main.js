function validateKey() {
    var inputValue = document.getElementById('passkey').value;
    if (inputValue.length === "5") {
        var completeUrl =
            'https://onedrive.live.com/embed?cid=DFF1B4D9CD55ADCA&resid=DFF1B4D9CD55ADCA%2126211&authkey=' +
                inputValue +
                'vRhKe6BOaU&em=2';
        var theFrame = document.getElementById("my_iframe");
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