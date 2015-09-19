define([
    'backbone',
    'jquery',
    'mustache'
], function (
    Backbone,
    $,
    Mustache
) {
    var ImagesView = Backbone.View.extend({
        el: '.image-stack.pane',
        template: document.getElementById('template-stack-item').innerHTML,
        events: {
            'click .remove': 'removeImage',
            'change .toggle': 'toggleImageVisibility',
            'change #merge-mode': 'changeMergeMode'
        },
        initialize: function (options) {
            this.images = options.images;
            this.preview = options.previewModel;

            this.elThumbnails = this.$('ol').get(0);
            this.elMergeMode = document.querySelector('#merge-mode');

            this.listenTo(this.images, 'add remove reset', this.render);
            this.listenTo(this.images, 'change:thumbnailURL', this.updateThumb);
        },
        render: function () {
            this.$el.toggleClass('has-images', this.images.length > 0);
            this.elThumbnails.innerHTML = Mustache.render(
                this.template,
                { images: this.images.toJSON() }
            );

            return this;
        },
        updateThumb: function (model, url) {
            var $li = this.$('#thumbnail-' + model.id);
            var $image = $li.find('img');

            $image.attr('src', url);
            $li.toggleClass('loading', url === '');

        },

        removeImage: function (evt) {
            var id = evt.target.getAttribute('data-id');
            this.images.remove(id);
        },
        toggleImageVisibility: function (evt) {
            var visible = evt.target.checked;
            var id = evt.target.getAttribute('data-id');
            var model = this.images.findWhere({ id: id });
            model.set('visible', visible);
            $(evt.target).closest('li').toggleClass('using', visible);
        },
        changeMergeMode: function () {
            var value = this.elMergeMode.value.split(':');
            var mode = value[0];
            var quality = value[1];

            this.preview.set('mergeMode', mode);
            if (quality) {
                this.preview.set('highQuality', quality === 'high');
            }
        }

    });

    return ImagesView;
});
