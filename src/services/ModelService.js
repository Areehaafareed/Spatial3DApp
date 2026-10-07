export class ModelService {
  static API_KEY = 'msy_JerCxuFYavNV0TXgzfUPSuAvGke6RuhTKAZE';
  static BASE_URL = 'https://api.meshy.ai/v1';

  static async uploadingModel(modelImage) {
    console.log(`ImageUrl is : ${modelImage}`);
    try {
      const response = await fetch(`${this.BASE_URL}/image-to-3d`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.API_KEY}`,
        },
        body: JSON.stringify({
          image_url: modelImage,
        }),
      });

      const resText = await response.text();
      
      if (response.status === 202) {
        const data = JSON.parse(resText);
        const imageID = data.result;
        console.log(`ID is: ${imageID} and Res is : ${resText}`);
        return imageID;
      } else {
        console.log(response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error uploading model:', error);
      return null;
    }
  }

  static async convertingUpdatingModel(modelID, setStatusText) {
    try {
      let modelLink = '';
      let progress = 0;
      const maxRetries = 50;
      let retryCount = 0;

      while (progress < 100 && retryCount < maxRetries) {
        retryCount++;

        const response = await fetch(`${this.BASE_URL}/image-to-3d/${modelID}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.API_KEY}`,
          },
        });

        if (response.status === 200) {
          const data = await response.json();
          progress = data.progress;

          if (progress === 100) {
            modelLink = data.model_urls?.glb || '';
            console.log(`Model link fetched successfully: ${modelLink}`);
            break;
          } else {
            console.log(`Image is Processing: ${progress}`);
            if (setStatusText) {
              setStatusText(`Processing 3D model: ${progress}%`);
            }
          }
        }

        // Wait for 2 seconds before next retry
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      return { progress, format: modelLink };
    } catch (ex) {
      console.error(`An Error Occurred: ${ex}`);
      return { progress: 0, format: '' };
    }
  }
}