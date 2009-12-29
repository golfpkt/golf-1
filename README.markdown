Golf Web Application Server
===========================

Golf is a web application server. It provides a way to build and deploy JavaScript (JS) driven webapps without sacrificing accessibility to JS-disabled browsers. By making dynamic, JS generated content fully accessible, Golf apps are designed from the ground up as clientside applications, and take advantage of a powerful, rich JS runtime environment.

Documentation For Golf Web Application Developers
=================================================

Please see [http://golf.github.com/](http://golf.github.com/).

Pre-built Binaries
==================

Please see [http://golf.github.com/install-golf-on-your-workstation/](http://golf.github.com/install-golf-on-your-workstation/).

Build From Source
=================

1. Clone the git repo.

        $ git clone git://github.com/golf/golf.git

2. Compile Golf, produce the `golf.zip` file, and install:
        
        $ cd golf
        $ ant install

3. You will be prompted for a directory to copy the jar file and the wrapper script to. Choose a directory that is in your path. Now you should be able to run Golf.

        $ golf --help

Javadocs
========

The javadocs can be generated the usual way:

       $ ant javadoc
