define([
    'backbone'
], function (
    Backbone
) {
    var FileView = Backbone.View.extend({
        el: 'body',
        events: {
            'click button.choose': 'showFilePicker',
            'change input.choose': 'filesChosen',
            'click button.remove-all': 'removeAll',
            'dragenter .image-stack.pane': 'onDragEnter',
            'dragover .drop-overlay': 'onDragOver',
            'dragleave .drop-overlay': 'onDragLeave',
            'drop .drop-overlay': 'onDrop',
            'click .save': 'saveImage'
        },
        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            this.$pane = this.$('.image-stack.pane');
            this.images = options.images;
        },

        showFilePicker: function () {
            this.elFileInput.click();
        },

        removeAll: function () {
            this.images.reset();
        },

        onDragEnter: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$pane.addClass('dragging');
        },
        onDragOver: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },
        onDragLeave: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$pane.removeClass('dragging');
        },
        onDrop: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.images.addFromFiles(evt.originalEvent.dataTransfer.files);
            this.$pane.removeClass('dragging');
        },
        filesChosen: function () {
            this.images.addFromFiles(this.elFileInput.files);
        },
        saveImage: function () {
            function padDigits(number) {
                return number < 10 ? '0' + number : number;
            }

            var link = document.createElement('a');
            var canvas = document.querySelector('.preview-image');
            var evt;
            var url;

            var now = new Date();
            var dateParts = [now.getMonth() + 1, now.getDate()].map(padDigits);
            var timeParts = [
                now.getHours(),
                now.getMinutes(),
                now.getSeconds()
            ].map(padDigits).join('-');
            dateParts = [now.getFullYear()].concat(dateParts).join('-');

            link.download = [
                'StackMerge',
                dateParts,
                timeParts
            ].join(' ');

            evt = document.createEvent('MouseEvents');
            evt.initMouseEvent('click', true, true, window,
                0, 0, 0, 0, 0,
                false, false, false, false,
                0, null);

            // toBlob() is much higher performance, and doesn't have the size
            // limitations of toDataURL(), but when I wrote this only Firefox
            // supported it.
            if (canvas.toBlob) {
                canvas.toBlob(function (blob) {
                    url = URL.createObjectURL(blob);
                    link.href = url;
                    link.dispatchEvent(evt);
                    URL.revokeObjectURL(url);
                });
            } else {
                link.href = canvas.toDataURL('image/jpeg', 0.8);
                link.dispatchEvent(evt);
            }
        }

    });

    return FileView;
});
