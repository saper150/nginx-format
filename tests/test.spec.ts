import { expect } from "chai"
import { nginxFormat } from "../src/index"


const testCases = [

	{
		input: 'error_log    logs/error.log  e ;',
		expect: 'error_log logs/error.log e;',
		message: 'should remove whitespace between arguments'
	},

	{
		input: `
error_log 
   logs/error.log  e 
 ;`,
		expect: `
error_log logs/error.log e;`,
		message: 'should remove whitespace between arguments'
	},

	{
		input: `
http {
error_log logs/error.log   e;
}`,
		expect: `
http {
	error_log logs/error.log e;
}`,
		message: 'should indent blocks'
	},

	{
		input: `#  comment`,
		expect: `#  comment`,
		message: 'should preserve comments'
	},

	{
		input: `
user    # comment
# comment
1;`,
		expect: `
user # comment
	# comment
	1;`,
		message: 'should work with comments between statement'
	},

	{
		input: `user       www www;  ## Default: nobody
worker_processes  5;  ## Default: 1`,
		expect: `user www www; ## Default: nobody
worker_processes 5; ## Default: 1`,
		message: 'should work with comments'
	},


	{
		input: `
user
# user
# comment2
1 #   comment
; #   comment`,
		expect: `
user
	# user
	# comment2
	1 #   comment
	; #   comment`,
		message: 'should work with comments between statements'
	},

	{
		input: `
http { # comment
	el el;
}`,
		expect: `
http { # comment
	el el;
}`,
		message: 'should work with comments in block statements'
	},

	{
		input: `
http {
	el el
	# comment
;
}`,
		expect: `
http {
	el el
		# comment
		;
}`,
		message: 'should work with comments in block statements'
	},

	{
		input: `
user user;

#comment

#comment2`,
		expect: `
user user;

#comment

#comment2`,
		message: 'should display trailing comments'
	},

	{
		input: `
location / {
proxy_pass      http://127.0.0.1:8080;
}`,
		expect: `
location / {
	proxy_pass http://127.0.0.1:8080;
}`,
		message: 'should work for urls'
	},

	{
		input: `
location ~ ^/(images|javascript|js|css|flash|media|static)/  {
root    /var/www/virtual/big.server.com/htdocs;
expires 30d;
}`,
		expect: `
location ~ ^/(images|javascript|js|css|flash|media|static)/ {
	root /var/www/virtual/big.server.com/htdocs;
	expires 30d;
}`,
		message: 'should work for regex'
	},

	{
		input: `
user user;#comment`,
		expect: `
user user; #comment`,
		message: 'should work when comment touches text'
	},

	{
		input: `
resolver 1.1.1.1 1.0.0.1 [2606:4700:4700::1111] [2606:4700:4700::1001] valid=300s;`,
		expect: `
resolver 1.1.1.1
	1.0.0.1
	[2606:4700:4700::1111]
	[2606:4700:4700::1001]
	valid=300s;`,
		message: 'hard case'
	},

	{
		input: `
		listen [::]:443 ssl http2;`,
		expect: `
listen [::]:443 ssl http2;`,
		message: 'hard case'
	},

	{
		input: `
server {
}

#comment
server {
}
		`,
		expect: `
server {
}

#comment
server {
}`,
		message: 'should keep whitespace between blocks when there is comment '
	},

	{
		input: `#comment
user user;`,
		expect: `#comment
user user;`,
		message: 'should not trim comment on first line'
	},

	{
		input: `#comment

		#comment
		#comment


user user;`,
		expect: `#comment

#comment
#comment


user user;`,
		message: 'leading comments'
	},



	{

		input: `
http {
	user user;
}`,
		expect: `
http {
  user user;
}`,
		options: { indent: '  ' },
		message: 'should respect indent options'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec';
}`,
		message: 'should break arguments when they are to long'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
	#comment
	
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		#comment
		'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		message: 'should break arguments when they are to long'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec'; # comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; # comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' #comment
	'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';   #comment
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec' #comment
		'Lorem ipsum dolor sit amet, consec'
		'Lorem ipsum dolor sit amet, consec'; #comment
}`,
		message: 'should not brake comment to new line'
	},

	{
		input: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		expect: `
http {
	user 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec' 'Lorem ipsum dolor sit amet, consec';
}`,
		options: { maxStatementLength: 1000 },
		message: 'should respect maxStatementLength'
	},

	{
		input: `
http {
	workers 10;
#comment
}`,
		expect: `
http {
	workers 10;
	#comment
}`,
		message: 'should indent comments in block'
	},

	{
		input: `
http {
	workers 10;


}`,
		expect: `
http {
	workers 10;


}`,
		message: 'should keep line separators between last statement and and of block'
	},

	{
		input: `
http {
	server {
		location ~ \.php$ {
			fastcgi_pass 127.0.0.1:1025;
		}
	}
}`,
		expect: `
http {
	server {
		location ~ \.php$ {
			fastcgi_pass 127.0.0.1:1025;
		}
	}
}`,
		message: 'nested blocks should have correct indentation'
	},

	{
		input: `
http {}`,
		expect: `
http {
}`,
		message: 'single line empty block'
	},

	{
		input: `
http{}`,
		expect: `
http {
}`,
		message: 'brace next to statement name'
	},

	{
		input: `
http {end 123;
}`,
		expect: `
http {
	end 123;
}`,
		message: 'should put statement on the same line that block to next line'
	},

	{
		only: false,
		input: `
http {
	statement 1; statement 2;
}`,
		expect: `
http {
	statement 1;
	statement 2;
}`,
		message: 'break same line statements 1'
	},

	{
		only: false,
		input: `
http {
	statement 
	1; statement 2;
}`,
		expect: `
http {
	statement 1;
	statement 2;
}`,
		message: 'break same line statements 2'
	},


	{
		input: `
http {
	rewrite ^(.*)$ https://\${server_name}$1 permanent;
}`,
		expect: `
http {
	rewrite ^(.*)$ https://\${server_name}$1 permanent;
}`,
		message: 'string interpolation'
	},

	{
		input: `
set $foo = 'foo';
set $foobar "\${foo}bar";`,
		expect: `
set $foo = 'foo';
set $foobar "\${foo}bar";`,
		message: 'string interpolation'
	},

	{
		input: `
location ~ "/img/([0-9a-fA-F]{2})([0-9a-fA-F]+)$";`,
		expect: `
location ~ "/img/([0-9a-fA-F]{2})([0-9a-fA-F]+)$";`,
		message: 'regex with braces'
	},

	{
		input: `
map $imgformat $pimgformat {
	default "png";
	".png" "png";
".jpeg" "jpeg";
}`,
		expect: `
map $imgformat $pimgformat {
	default "png";
	".png" "png";
	".jpeg" "jpeg";
}`,
	message: 'directive in quotes'
},





// 	{
// 		input: `
// http {
// 	statement
// 		#cool
// 	1; statement 2; # comm
// }`,
// 		expect: `
// http {
// 	statement 1; statement 2; #comment
// }`,
// 		message: 'should not duplicate comments when braking line'
// 	},

]

describe('formatNginxConfig', () => {

	const onlyTestCase = testCases.find((x: any) => x.only)

	for (const testCase of onlyTestCase ? [onlyTestCase] : testCases) {
		it(testCase.message, () => {
			expect(nginxFormat(testCase.input, (testCase as any).options || {})).to.eq(testCase.expect)
		})
	}

})
