define([
    'backbone'
], function (
    Backbone
) {
    var UploadView = Backbone.View.extend({
        el: '.upload-controls',
        events: {
            'click button.choose': 'showFilePicker',
            'change input.choose': 'filesChosen',
            'dragenter': 'onDragEnter',
            'dragover': 'onDragOver',
            'dragleave .drop-overlay': 'onDragLeave',
            'drop': 'onDrop',
        },
        initialize: function (options) {
            this.elFileInput = this.$('input.choose').get(0);
            //this.elUploadList = this.$('ol.upload-list').get(0);
            this.images = options.images;
        },

        // Custom methods
        showFilePicker: function () {
            this.elFileInput.click();
        },

        onDragEnter: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$el.addClass('dragging');
        },
        onDragOver: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
        },
        onDragLeave: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.$el.removeClass('dragging');
        },
        onDrop: function (evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.images.addFromFiles(evt.originalEvent.dataTransfer.files);
            this.$el.removeClass('dragging');
        },

        filesChosen: function () {
            this.images.addFromFiles(this.elFileInput.files);
        }

    });

    return UploadView;
});
