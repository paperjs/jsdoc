/** @namespace */
pack = {}

pack.build = function(task) {};

// This is a bit of a punt because the author could mean pack.pack.build.install
// but we assume the more likely case, author meant pack.build.install.
// Note that this doesn't assume you mean @static, even though you probably do.
/** @memberOf pack */
pack.build.install = function() {}

// That trailing dot is a shortcut way of adding a @static tag.
/** @memberOf pack. */
pack.build.test = function() {}

// Now looks like author really does means to add this to pack.
// This doesn't assume you mean @static either, so at least it's symmetrical.
// A trailing dot name would've worked the same as the above example here too.
/** @memberOf pack */
build.clean = function() {}
