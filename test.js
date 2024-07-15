// 重试次数5
let choseCount = 5
// TODO: 选择发布方式
async function testChose() {
  console.log('testChose');
  // 发布方式选择
  // 找到目标文本的 <p> 元素
  const targetText = '发布时间';

  try {
    const allElements = await waitForElement('p', { isAll: true });
    console.log(allElements, 'allElements');
    const targetPElement = Array.from(allElements)
      .find(p => p.textContent.trim() === targetText);

    if (targetPElement) {
      console.log('找到的 <p> 元素:', targetPElement);

      const parentElement = targetPElement.parentElement;
      const nextSiblingElement = parentElement.nextElementSibling;

      if (nextSiblingElement) {
        console.log('找到的父级的下一个兄弟元素:', nextSiblingElement);

        // 找到第一个和第二个checkbox
        const checkboxes = nextSiblingElement.querySelectorAll('input[type="checkbox"]');
        const firstCheckbox = checkboxes[0];
        const secondCheckbox = checkboxes[1];

        if (firstCheckbox) {
          console.log('找到的 firstCheckbox 元素:', firstCheckbox);
        } else {
          console.log('在下一个兄弟元素中未找到 firstCheckbox');
        }

        if (secondCheckbox) {
          secondCheckbox.click();
          console.log('找到的 secondCheckbox 元素并点击:', secondCheckbox);

          await delay(2000);

          // 找到日期和时间的输入框并设置值
          const inputElement = await waitForElement('input.semi-input.semi-input-default[placeholder="日期和时间"]');
          if (inputElement) {
            // // inputElement.value = sendTime;
            // inputElement.value = '2024-07-16 15:00:00';
            // console.log('设置了定时发布的时间:', inputElement, inputElement.value);
            // inputElement.dispatchEvent(new Event('change', { bubbles: true }));
            // 获取缓存数据
            const { type, cache } = parseJSON(localStorage.getItem('publish_form_cache:1484759341480379'))
            // 重新赋值 cache 数据
            const newCacheData = {
              ...cache,
              itemTitle: taskName,
              scheduleTime: '2024-07-16 15:00:00',
              textResult: {
                text: taskName,
                textExtra: [],
                activity: [],
                caption: remark
              }
            };
            const newData = JSON.stringify({ type, cache: newCacheData });
            localStorage.setItem('publish_form_cache:1484759341480379', newData);

          } else {
            console.log('未找到定时发布的输入框');
          }
        } else {
          console.log('在下一个兄弟元素中未找到 secondCheckbox');

        }
      } else {
        console.log('父级元素没有下一个兄弟元素');

      }

    } else {
      console.log('未找到目标文本的 <p> 元素');
      await delay(2000);
      choseCount--
      if (choseCount > 0) {
        await testChose()
      } else {
        console.error('未找到目标文本的 <p> 元素');
      }
    }
  } catch (error) {
    console.error('testChose 出现错误:', error);
  }
}