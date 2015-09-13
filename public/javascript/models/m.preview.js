define([
    'backbone'
], function (
    Backbone
) {
    // The model itself doesn't really do anything beyond what Backbone already
    // provides, it's just a handy central way to make the preview update when
    // necessary.
    var PreviewModel = Backbone.Model.extend({
        defaults: {
            size: { width: 0, height: 0 },
            progress: 0,
            blendingMode: 'median'
        }
    });

    return PreviewModel;
});
