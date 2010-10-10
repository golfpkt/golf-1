The Golf Web Application Server
===============================

  <object width="640" height="385"><param name="movie" value="http://www.youtube.com/v/4cmWRTVOBpo?fs=1&amp;hl=en_US"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="http://www.youtube.com/v/4cmWRTVOBpo?fs=1&amp;hl=en_US" type="application/x-shockwave-flash" allowscriptaccess="always" allowfullscreen="true" width="640" height="385"></embed></object>

Golf is a web application server. It provides a way to build and deploy JavaScript driven webapps without sacrificing accessibility to JavaScript-disabled browsers (search engines, for example). By making dynamic content and behaviors fully accessible, Golf apps are designed from the ground up as clientside applications. As such, they are able to take full advantage of a powerful, rich JavaScript runtime environment. Golf both simplifies and adds power to the process of writing apps for the web.

Documentation For Golf Web Application Developers
-------------------------------------------------

Please see [http://golf.github.com/](http://golf.github.com/).

Pre-built Binaries
------------------

Please see [http://golf.github.com/install-golf-on-your-workstation/](http://golf.github.com/install-golf-on-your-workstation/).

Build From Source
-----------------

1. Clone the git repo.

        $ git clone git://github.com/golf/golf.git

2. Compile Golf, produce the `golf.zip` file, and install:
        
        $ cd golf
        $ ant install

3. You will be prompted for a directory to copy the jar file and the wrapper script to. Choose a directory that is in your path. Now you should be able to run Golf.

        $ golf --help

4. Javadocs can be generated the usual way:

        $ ant Javadoc

Hack
----

Please feel free to fork and hack! Pull requests and/or patches are always welcomed. Also, feel free to hit us up in our IRC channel on freenode: [#golfdev](irc://irc.freenode.net/golfdev).
