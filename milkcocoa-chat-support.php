<?php
/*
Plugin Name: Milkcocoa Chat Support
Plugin URI: http://wordpress.org/plugins/milkcocoa-chat-support/
Description: Live chat system using Milkcocoa, BaaS platform for building realtime apps.
Author: Milkcocoa
Author URI: https://mlkcca.com/
Version: 1.0.0
Text Domain: milkcocoa-chat-support
Domain Path: /languages/
License: GPL-2.0+

Copyright 2015 Milkcocoa (email : contact@mlkcca.com)

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License, version 2, as
published by the Free Software Foundation.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/


require_once(dirname(__FILE__) . "/jwt/JWT.php");
use Firebase\JWT\JWT as JWT;


function is_supported_user_agent () {

  $ua = mb_strtolower($_SERVER['HTTP_USER_AGENT']);
  $is_supported = true;

  // not-work or untested
  $unsupported_devices = array("ie_6","ie_7","ie_8","ie_9","android_2","ipod","windows_phone","windows_tablet","firefox_mobile", "firefox_tablet", "blackberry", "playbook", "kindle");

  $ua_matches = array(
    "ie_6" => strpos($ua,"msie 6.0") !== false, // not-work
    "ie_7" => strpos($ua,"msie 7.0") !== false, // not-work
    "ie_8" => strpos($ua,"msie 8.0") !== false, // not-work
    "ie_9" => strpos($ua,"msie 9.0") !== false, // not-work
    "ie_10" => strpos($ua,"msie 10.0") !== false, // work
    "ie_11" => strpos($ua,"trident") !== false, // work
    "android_mobile" => (strpos($ua,'android') !== false) && (strpos($ua, 'mobile') !== false), // depends on version
    "android_tablet" => (strpos($ua,'android') !== false) && (strpos($ua, 'mobile') === false), // depends on version
    "android_2" => preg_match('/android 2.[123]/', $ua), // not-work
    "android_4" => preg_match('/android 4.[01234]/', $ua), // work
    "android_5" => preg_match('/android 5.[01234]/', $ua), // work
    "iphone" => strpos($ua,'iphone') !== false, // work
    "ipod" => strpos($ua,'ipod') !== false, // untested
    "ipad" => strpos($ua,'ipad') !== false, // work
    "windows_phone" => (strpos($ua,'windows') !== false) && (strpos($ua, 'phone') !== false), // untested
    "windows_tablet" => (strpos($ua,'windows') !== false) && (strpos($ua, 'touch') !== false), // untested
    "firefox_mobile" => (strpos($ua,'firefox') !== false) && (strpos($ua, 'mobile') !== false), // untested
    "firefox_tablet" => (strpos($ua,'firefox') !== false) && (strpos($ua, 'tablet') !== false), // untested
    "blackberry" => strpos($ua,'blackberry') !== false, // untested
    "playbook" => strpos($ua,'playbook') !== false, // untested
    "kindle" =>  (strpos($ua,'kindle') !== false) || (strpos($ua, 'silk') !== false) // untested
  );

  foreach($unsupported_devices as $device){
    if($ua_matches[$device]) $is_supported = false;
  }

  return $is_supported;

}


class MilkcocoaChatSupport {

    const TEXT_DOMAIN = 'milkcocoa-chat-support';

    function __construct() {

        $options = get_option('chatsupport_options');
        $is_registered = isset($options['is_registered']) ? $options['is_registered']: null;

        // user ID
        add_action('init', array($this, 'set_user_id'));

        // admin
        add_action('admin_menu', array($this, 'add_pages'));

        if(is_supported_user_agent() && $options['is_registered']){
          // user
          add_action('wp_footer', array($this, 'show_customer_html'));
          add_action('wp_enqueue_scripts', array($this, 'load_css'));
          add_action('wp_enqueue_scripts', array($this, 'load_customer_milkcocoa'));
          add_action('wp_enqueue_scripts', array($this, 'load_customer_js'));
        }

        // languages
        add_action('plugins_loaded', array($this, 'trigger_load_plugin_textdomain'));
    }

    function trigger_load_plugin_textdomain(){
      load_plugin_textdomain( self::TEXT_DOMAIN, FALSE, basename( dirname( __FILE__ ) ) . '/languages/' );
    }

    function set_user_id(){
        if (!isset($_COOKIE["MilkcocoaUniqueUserID"])){
            session_start();
            // generate unique user id
            $uuid = uniqid('mlkuser-', true);
            $_COOKIE["MilkcocoaUniqueUserID"] = time().$uuid;
            // cookie expire after 30days
            setcookie("MilkcocoaUniqueUserID", time().$uuid, time() + 2592000);
        }
    }

    function add_pages() {
      add_options_page(
        __( 'Milkcocoa Settings', self::TEXT_DOMAIN ),
        __( 'Milkcocoa Settings', self::TEXT_DOMAIN ),
        'level_8',
        'MilkcocoaSettings',
        array($this,'show_option_page'));

      $pluginPage = add_menu_page(
        'Mlk Chat Support',
        'Mlk Chat Support',
        'level_7',
        __FILE__,
        array($this,'show_admin_chat_page'), 'dashicons-format-chat', 26);

      // only plugin page
      add_action( "admin_print_styles-$pluginPage", array($this, 'load_css'));
      add_action( "admin_print_scripts-$pluginPage", array($this, 'load_operator_milkcocoa'));
      add_action( "admin_print_scripts-$pluginPage", array($this, 'load_operator_js'));
    }

    function show_admin_chat_page(){
        ?>
        <div class="wrap">
        <h2 style="margin-bottom: 0.5em;">Milkcocoa Chat Support</h2>
        <dl>
          <dt scope="row" style="font-weight: bold; font-size: 14px; display: inline-block; position: relative; top: -8px"><?php _e('Are you active?', self::TEXT_DOMAIN ); ?></dt>
          <dd style="margin-left: 0; display: inline-block;">
            <input id="mcs-isActive" name="mcs-isActive" class="mcs-isActive" type="checkbox" />
            <label for="mcs-isActive" class="mcs-isActiveLabel"></label>
          </dd>
        </dl>
        <div id="mcs-chats"></div>
        </div>
        <?php
    }

    function show_option_page() {

      if ( isset($_POST['chatsupport_options'])) {
          check_admin_referer('milkcocoa-chat-support-option-save');
          if(is_admin() && (current_user_can('administrator')) ){
            $options = $_POST['chatsupport_options'];

            // show ui to customer after saving.
            $options['is_registered'] = true;
            update_option('chatsupport_options', $options);

            $secret_key = isset($options['key']) ? $options['key']: null;
            // user input appid
            $app_id = isset($options['appid']) ? $options['appid']: null;
            // get current host
            $url = (empty($_SERVER["HTTPS"]) ? "http://" : "https://") . $_SERVER["HTTP_HOST"];

            // get current username
            global $current_user;
            get_currentuserinfo();

            // token expire after 30000s
            $json = json_decode('{"iss":"'.$url.'","sub":"'.$current_user->user_login.'","iat":'.time().',"exp":'.(time()+30000).'}');

            $jwt = JWT::encode($json, $secret_key);
          }
          ?><div class="updated fade"><p><strong><?php _e('Option saved.', self::TEXT_DOMAIN ); ?></strong></p></div>
          <!--<script src="http://cdn.mlkcca.com/v2.0.0/milkcocoa.js"></script>-->
          <script src="http://milkcocoa.s3-website-ap-northeast-1.amazonaws.com/v2.0.0/dev/milkcocoa.js"></script>
          <script>
          window.onload = function(){
            var milkcocoa = new MilkCocoa("<?php echo esc_js($app_id) ?>.mlkcca.com");

            milkcocoa.authWithToken('<?php echo esc_js($jwt) ?>', function(err,user) {
              if(err) {
                 switch(err){
                  case 'invalid':
                    alert('<?php _e("Invalid token. Please check your secret key is correct.", self::TEXT_DOMAIN ); ?>');
                    break;
                  case 'origin denied':
                    alert('<?php _e("Origin denied. Please set your website-URL in “Milkcocoa’s admin page > Settings > Allowed Origin”.", self::TEXT_DOMAIN ); ?>');
                    break;
                  default:
                    alert('<?php _e("Unhandled error. Please refresh and input it again.", self::TEXT_DOMAIN ); ?>');
                    break;
                 }
                return;
              }
              milkcocoa.dataStore('operator').set(user.sub, {active: false});
              alert('Logged in as '+user.sub+'!');
            });
          };
          </script>

          <?php
      }
      ?>
      <div class="wrap">
      <h2><?php _e('Milkcocoa Settings', self::TEXT_DOMAIN ); ?></h2>

      <p><?php _e('1. Create account of <a href="https://mlkcca.com/en/">Milkcocoa</a>.<br>
2. Log in and create app.<br>
3. Set your website-URL(below) in <span style="font-style: italic;">“Milkcocoa’s admin page > Settings > Allowed Origin”</span>(Delete origins already exist(<code>localhost</code>, <code>127.0.0.1</code>))', self::TEXT_DOMAIN ); ?></p>
          <div style="padding: 5px 20px; border: 1px solid #e2e2e2; background: #fff;"><?php echo (empty($_SERVER["HTTPS"]) ? "" : "https://") . $_SERVER["HTTP_HOST"]; ?></div>

      <p><?php _e('After register Allowed Origin, <br>
4. Copy app_id, <code>var milkcocoa = new MilkCocoa("<span style="font-style: italic;">this-string</span>.mlkcca.com");</code> in <span style="font-style: italic;">“Milkcocoa’s admin page > Overview”</span>, and paste it below.<br>
5. Copy secret key, in <span style="font-style: italic;">“Milkcocoa’s admin page > Auth > In case of authrocket”</span>, and paste it below.', self::TEXT_DOMAIN ); ?></p>
          <form action="" method="post">
              <?php

                if( is_admin() && (current_user_can('administrator')) ){
                    wp_nonce_field('milkcocoa-chat-support-option-save');
                    $options = get_option('chatsupport_options');
                    $secret_key = isset($options['key']) ? $options['key']: null;
                    $app_id = isset($options['appid']) ? $options['appid']: null;
                }

                global $current_user;
                get_currentuserinfo();

              ?>
              <table class="form-table">
                <tr valign="top">
                    <th scope="row"><label for="inputAppId">app_id</label></th>
                    <td><input name="chatsupport_options[appid]" type="text" id="inputAppId" value="<?php  echo sanitize_text_field($app_id) ?>" class="regular-text" /></td>
                </tr>
                <tr valign="top">
                    <th scope="row"><label for="inputSecretKey">secret key</label></th>
                    <td><input name="chatsupport_options[key]" type="text" id="inputSecretKey" value="<?php  echo sanitize_text_field($secret_key) ?>" class="regular-text" /></td>
                </tr>
              </table>
              <p class="submit"><input type="submit" name="Submit" class="button-primary" value="<?php _e('Save', self::TEXT_DOMAIN ); ?>" /></p>
          </form>

          <p><?php _e('After register app_id and secret key,<br>
6. Copy code below, and paste and save in <span style="font-style: italic;">“Milkcocoa’s admin page > Security Rule”</span>.<br>
<strong>Make sure to set security rules. It is important to make chats secure.</strong>', self::TEXT_DOMAIN ); ?></p>
          <div style="padding: 5px 20px; border: 1px solid #e2e2e2; background: #fff;">
<pre><code style="background: #fff;">
master {
  permit : all;
  rule : account.sub == '<?php echo $current_user->user_login ?>';
}
master/[userID] {
  permit : query, get, send, on(push), on(set), on(remove), on(send);
  rule : account.sub == userID;
}
master/[userID] {
  permit : push;
  rule : account.sub == userID && newData.hasKey("content") && newData.hasKey("publisher");
}
master/[userID] {
  permit : set;
  rule : account.sub == userID && newData.hasKey("isclose") && newData.hasKey("unread");
}
index {
  permit: all;
  rule : account.sub == '<?php echo $current_user->user_login ?>';
}
index {
  permit : set;
  rule : true;
}
operator {
  permit : all;
  rule : account.sub == '<?php echo $current_user->user_login ?>';
}
operator {
  permit : query, on(set);
  rule : true;
}
</code></pre>
          </div>
          <p><?php _e('When you use it in plural users, add code below in Security rule.', self::TEXT_DOMAIN ); ?></p>
          <div style="padding: 5px 20px; border: 1px solid #e2e2e2; background: #fff; margin-bottom: 30px;">
<pre><code style="background: #fff;">
master {
  permit : all;
  rule : account.sub == '<?php _e('The Wordpress user name that you want to give authority to', self::TEXT_DOMAIN ); ?>';
}
index {
  permit: all;
  rule : account.sub == '<?php _e('The Wordpress user name that you want to give authority to', self::TEXT_DOMAIN ); ?>';
}
operator {
  permit : all;
  rule : account.sub == '<?php _e('The Wordpress user name that you want to give authority to', self::TEXT_DOMAIN ); ?>';
}
</code></pre>
          </div>
          <hr>
          <h2>Tips</h2>
          <p><?php _e('You can change styles adding CSS to following classes. Please use <code>!important</code> to override default styles.', self::TEXT_DOMAIN ); ?></p>
          <table class="widefat">
            <tbody>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Header', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-header</code></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Title', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-title</code></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Unread Count', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-count</code><?php _e('(unread count > 1: use <code>.mcs-chat.is-highlighten .mcs-theme-count</code>)', self::TEXT_DOMAIN ); ?></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Hide Chat', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-hide</code></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Background', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-back</code></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Oppenent Message', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-opp</code>（<?php _e('when you change <code>background-color</code>, you should also change <code>border-right-color</code>', self::TEXT_DOMAIN ); ?>）</td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('My message', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-you</code>（<?php _e('when you change <code>background-color</code>, you should also change <code>border-left-color</code>', self::TEXT_DOMAIN ); ?>）</td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Horizontal Rule', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-hr</code></td></tr>
              <tr class="alternate"><th style="padding: 0.5rem;
  border: 1px solid rgba(0,0,0,.12); font-weight: bold;background-color: rgba(0,0,0,.04);"><?php _e('Input Field', self::TEXT_DOMAIN ); ?></th><td style="padding: 0.5rem; border: 1px solid rgba(0,0,0,.12);"><code>.mcs-theme-input</code></td></tr>
            </tbody>
          </table>
          <p><?php _e('Examples: ', self::TEXT_DOMAIN ); ?></p>
          <div style="padding: 5px 20px; border: 1px solid #e2e2e2; background: #fff; margin-bottom: 30px;">
<pre><code style="background: #fff;">
.mcs-theme-header{
  background-color: #4273AB !important;
}
.mcs-theme-title{
  color: #fff !important;
}
.mcs-theme-count{
  background-color: rgba(255,255,255,.5) !important;
  color: #fff !important;
}
.mcs-chat.is-highlighten .mcs-theme-count{
  background-color: #DE6200 !important;
}
.mcs-theme-hide{
  color: #fff !important;
  opacity: 0.7;
}
.mcs-theme-hide:hover{
  opacity: 1;
}
.mcs-theme-you{
  background-color: #E0EFF7 !important;
  border-left-color: #E0EFF7 !important;
}
</code></pre>
        </div>
      <!-- /.wrap --></div>
      <?php
    }

    function load_css(){
        wp_register_style('mcs-style', plugins_url('/css/chat.css', __FILE__));
        wp_enqueue_style('mcs-style');
    }

    function load_customer_js(){

        wp_register_script('mcs-customer-script', plugins_url('/js/customer.js', __FILE__));

        $uuid = $_COOKIE["MilkcocoaUniqueUserID"];
        $options = get_option('chatsupport_options');
        // user input secretkey
        $secret_key = isset($options['key']) ? $options['key']: null;
        // user input app_id
        $app_id = isset($options['appid']) ? $options['appid']: null;
        // get current host
        $url = (empty($_SERVER["HTTPS"]) ? "http://" : "https://") . $_SERVER["HTTP_HOST"];

        // token expire after 30000s
        $json = json_decode('{"iss":"'.$url.'","sub":"'.$uuid.'","iat":'.time().',"exp":'.(time()+30000).'}');

        $jwt = JWT::encode($json, $secret_key);

        $variable_array = array( "token" => esc_js($jwt), "app_id" => esc_js($app_id), "uuid" => esc_js($uuid), "leaveMessage" => __( 'Please leave a message and E-mail, we will reply later.', self::TEXT_DOMAIN ), "activeAction" =>__( 'Online: Chat!', self::TEXT_DOMAIN ), "notActiveAction" =>__( 'Offline: Leave a message', self::TEXT_DOMAIN ), "inputPlaceholder" =>__( 'Press ‘Enter’ to send message.', self::TEXT_DOMAIN ));
        wp_localize_script( 'mcs-customer-script', 'imported_customer_value', $variable_array);

        wp_enqueue_script('mcs-customer-script', false, array(), false, true);
    }

    function load_operator_js(){

      if(is_admin() && (current_user_can('administrator') || current_user_can('editor')) ){

        wp_register_script( 'mcs-operator-script', plugins_url('/js/operator.js', __FILE__));

        $options = get_option('chatsupport_options');
        // user input secretkey
        $secret_key = isset($options['key']) ? $options['key']: null;
        // user input appid
        $app_id = isset($options['appid']) ? $options['appid']: null;
        // get current host
        $url = (empty($_SERVER["HTTPS"]) ? "http://" : "https://") . $_SERVER["HTTP_HOST"];

        // get current username
        global $current_user;
        get_currentuserinfo();

        // token expire after 30000s
        $json = json_decode('{"iss":"'.$url.'","sub":"'.$current_user->user_login.'","iat":'.time().',"exp":'.(time()+30000).'}');

        $jwt = JWT::encode($json, $secret_key);

        $variable_array = array( "token" => esc_js($jwt), "app_id" => esc_js($app_id), "current_user" => esc_js($current_user->user_login), "deleteConfirm" =>__( 'You cannot restore the deleted chat. Are you sure to delete this chat?', self::TEXT_DOMAIN ));

        wp_localize_script( 'mcs-operator-script', 'imported_operator_value', $variable_array);

        wp_enqueue_script( 'mcs-operator-script' );
      }
    }

    function load_operator_milkcocoa(){

      wp_register_script('mcs-operator-milkcocoa', 'http://milkcocoa.s3-website-ap-northeast-1.amazonaws.com/v2.0.0/dev/milkcocoa.js', __FILE__);
      wp_enqueue_script('mcs-operator-milkcocoa');
      ?>
      <!--<script src="http://cdn.mlkcca.com/v2.0.0/milkcocoa.js"></script>-->
      <!--<script src="http://milkcocoa.s3-website-ap-northeast-1.amazonaws.com/v2.0.0/dev/milkcocoa.js"></script> -->
      <?php
    }

    function load_customer_milkcocoa(){

      wp_register_script('mcs-customer-milkcocoa', 'http://milkcocoa.s3-website-ap-northeast-1.amazonaws.com/v2.0.0/dev/milkcocoa.js', __FILE__);
      wp_enqueue_script('mcs-customer-milkcocoa', false, array(), false, true);
      ?>
      <!--<script src="http://cdn.mlkcca.com/v2.0.0/milkcocoa.js"></script>-->
      <!--<script src="http://milkcocoa.s3-website-ap-northeast-1.amazonaws.com/v2.0.0/dev/milkcocoa.js"></script> -->
      <?php
    }

    function show_customer_html(){
      ?>
      <div id="mcs-chat-container" class="mcs-chatLayout mcs-chatLayout--customer mcs-chatLayout--right">
        <div class="mcs-chat mcs-chat--right is-close">
          <div class="mcs-chat__inner mcs-theme-back">
            <div class="mcs-chat__header mcs-header mcs-theme-header"></div>
          </div>
        </div>
      </div>
      <?php
    }

}

new MilkcocoaChatSupport;