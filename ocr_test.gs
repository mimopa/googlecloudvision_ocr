// �v���p�e�B�擾
var PROPERTIES = PropertiesService.getScriptProperties();

// LINE�ݒ�
var LINE_ACCESS_TOKEN = PROPERTIES.getProperty('LINE_ACCESS_TOKEN');
var LINE_END_POINT = "https://api.line.me/v2/bot/message/reply";

// Google Cloud Vision API�ݒ�
var VISION_ACCESS_TOKEN = PROPERTIES.getProperty('VISION_ACCESS_TOKEN');

// ���O�o�͗p��Google Docs�ݒ�
var GOOGLE_DOCS_ID = PROPERTIES.getProperty('GOOGLE_DOCS_ID');
Logger.log("GOOGLE_DOCS_ID: %s", GOOGLE_DOCS_ID)
var doc = DocumentApp.openById(GOOGLE_DOCS_ID);

function doGet(){
  Logger.log("doGet")
}

function doPost(e){
  
  Logger.log("POST DATA CHECK: %s", e)
  try {
    // �f�o�b�O���̔��f
    if (typeof e === "undefined") {
      var url = "http://blog.re-presentation.jp/wp-content/uploads/2016/01/WS001349-1024x576.jpg"
      Logger.log("[DEBUG] END POINT: %s", url)
    } else {
      Logger.log("[INFO] POST���N�G�X�g���Ăяo����܂���")
      var json = JSON.parse(e.postData.contents);
      var reply_token = json.events[0].replyToken;
      var messageId = json.events[0].message.id;
      var url = 'https://api.line.me/v2/bot/message/'+ messageId +'/content/' //�o�C�i���t�@�C���̉摜���擾�ł���G���h�|�C���g
      Logger.log("LINE END POINT FOUND: %s")
    }
    // LINE����摜���󂯎���āAbase64�`���Ŏ擾����blob�t�@�C����Ԃ�
    var imageResponse = getImageResponse(url);
    var blobBase64 = Utilities.base64Encode(imageResponse.getContent());
    
    // blob�t�@�C�����AGoogle Vision API�ɂ��܂��āA�e�L�X�g���擾����
    var text = getText(blobBase64);
    
    // �擾�����摜�ɕ������܂܂�Ă��Ȃ��ꍇ�A�������̓G���[���N�������ꍇ
    if (typeof text === "undefined") {
      text = "�摜���當�������o�ł��܂���ł����B"
    }
    
    // LINE�Ƀe�L�X�g�t�@�C����Ԃ�
    postLine(text, reply_token);
  } catch(e) {
    Logger.log("Failed: %s", e)
    text = "�����N�������s�B"
    postLine(text, reply_token);
    doc.getBody().appendParagraph(Logger.getLog())
  }
  doc.getBody().appendParagraph(Logger.getLog())
}

function getImageResponse(url) {
  /*
  * LINE�ɑ���ꂽ�摜�t�@�C�����Abase64�`���ɕϊ�����BLOB�I�u�W�F�N�g��Ԃ�
  * @param {object}: URL
  * @return {Blob}: LINE�ɑ���ꂽ�摜�t�@�C���̃o�C�i��
  */
  try {
    var res = UrlFetchApp.fetch(url, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
      },
      'method': 'get'
    });
    return res;
  // �G���[�̏ꍇ
  } catch(e) {
    Logger.log("Error at function getImageResponse(url): %s", e)
  }
}

function getText(blobBase64) {
/*
* LINE�ɑ���ꂽ�摜�t�@�C���̃o�C�i������AGoogle Vision API�ɂ��܂��ĕ������z�������e�L�X�g���擾����
* @param {blob}: LINE�ɑ���ꂽ�摜�t�@�C���̃o�C�i��
* @return {String}: �e�L�X�g�`���̉摜
* referencr:
*/
  try {
    var payload = JSON.stringify({
      "requests":[
        {
          "image": {
            "content": blobBase64
          },
          "features": [
            {
              "type": "DOCUMENT_TEXT_DETECTION",
              "maxResults": 1
            }
          ]
        }
      ]
    });

    var requestUrl = 'https://vision.googleapis.com/v1/images:annotate?key=' + VISION_ACCESS_TOKEN;
    var response = UrlFetchApp.fetch(requestUrl, {
      method: 'POST',
      contentType: 'application/json',
      payload: payload,
      muteHttpExceptions: true
    });
    // ���X�|���X�̏���
    response = response.getContentText();
    //Logger.log(response)
    var json = JSON.parse(response);
    var responses = json.responses;
    //Logger.log(responses)
    for (i in responses) {
      if (responses[i].fullTextAnnotation.text) {
        text = responses[i].fullTextAnnotation.text
        Logger.log("�ȉ��̃e�L�X�g�����o���܂���: %s", text)
        return text;
      }
    }
  } catch(e) {
    Logger.log("Error at function getText(blobBase64): %s", e)
  }
}

function postLine(text, reply_token) {
 /*
 * LINE�Ƀe�L�X�g��Ԃ��܂�
 * @param {String}: �����N���������e�L�X�g
 */
  try {
    var messages = [
      {
        "type": "text",
        "text": text
      }
    ]
    var res = UrlFetchApp.fetch(LINE_END_POINT, {
      'headers': {
        'Content-Type': 'application/json; charset=UTF-8',
        'Authorization': 'Bearer ' + LINE_ACCESS_TOKEN,
      },
      'method': 'post',
      'payload': JSON.stringify({
        'replyToken': reply_token,
        'messages': messages,
      }),
    });
  } catch(e) {
    Logger.log("Error at function postLine(text, reply_token): %s", e)
  }
}